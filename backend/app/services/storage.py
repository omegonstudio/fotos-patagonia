import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
import logging
import uuid
from typing import List

from core.config import settings
from pydantic import BaseModel

# Pydantic models for service contract
class FileInfo(BaseModel):
    filename: str
    contentType: str

class PresignedURLData(BaseModel):
    upload_url: str
    object_name: str
    original_filename: str

class StorageService:
    def __init__(self):
        if not all([settings.S3_ENDPOINT_URL, settings.S3_ACCESS_KEY_ID, settings.S3_SECRET_ACCESS_KEY, settings.S3_BUCKET_NAME]):
            raise ValueError("S3 settings are not configured properly.")

        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name='us-east-1',  # Explicitly set region for signature consistency
            config=Config(
                signature_version='s3v4'
            )
        )
        self.bucket_name = settings.S3_BUCKET_NAME

        # Ensure the bucket exists, create it if it does not.
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            # If a 404 error is raised, the bucket does not exist.
            if e.response['Error']['Code'] == '404':
                logging.info(f"Bucket '{self.bucket_name}' not found. Creating it.")
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                logging.info(f"Bucket '{self.bucket_name}' created successfully.")
            else:
                logging.error("Error checking for bucket:", e)
                raise

    def generate_presigned_put_url(self, object_name: str, content_type: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL to upload an object to S3.
        """
        try:
            response = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_name,
                    'ContentType': content_type
                },
                ExpiresIn=expiration
            )
            # Replace internal docker URL with public-facing URL if configured
            if settings.S3_PUBLIC_URL and settings.S3_ENDPOINT_URL:
                return response.replace(settings.S3_ENDPOINT_URL, settings.S3_PUBLIC_URL)
            return response
        except ClientError as e:
            logging.error(f"Error generating presigned PUT URL: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not generate upload URL."
            )

    def generate_presigned_get_url(self, object_name: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL to view an object from S3.
        """
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
            # Replace internal docker URL with public-facing URL if configured
            if settings.S3_PUBLIC_URL and settings.S3_ENDPOINT_URL:
                return response.replace(settings.S3_ENDPOINT_URL, settings.S3_PUBLIC_URL)
            return response
        except ClientError as e:
            logging.error(f"Error generating presigned GET URL: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not generate view URL."
            )

    def delete_file(self, object_name: str):
        """
        Deletes a file from the S3-compatible storage.
        :param object_name: The key of the object to delete.
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_name
            )
            logging.info(f"Successfully deleted {object_name} from bucket {self.bucket_name}")
        except ClientError as e:
            logging.error(f"Error deleting file {object_name} from S3: {e}")
            # Re-raise as a generic HTTPException to avoid leaking too much detail
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not delete file from storage."
            )

    def prepare_upload_urls(self, files_info: List[FileInfo]) -> List[PresignedURLData]:
        """
        Prepares a list of presigned PUT URLs for multiple files.
        Generates unique object names and includes content type in the signature.
        """
        response_data = []
        if not files_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File list cannot be empty."
            )

        for file_info in files_info:
            try:
                file_extension = file_info.filename.split('.')[-1] if '.' in file_info.filename else ''
                unique_id = uuid.uuid4()
                object_name = f"photos/{unique_id}.{file_extension}" if file_extension else f"photos/{unique_id}"

                upload_url = self.generate_presigned_put_url(
                    object_name=object_name,
                    content_type=file_info.contentType
                )
                
                response_data.append(
                    PresignedURLData(
                        upload_url=upload_url,
                        object_name=object_name,
                        original_filename=file_info.filename
                    )
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to prepare upload URL for {file_info.filename}: {str(e)}"
                )
        return response_data

storage_service = StorageService()

