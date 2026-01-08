from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from pydantic import BaseModel

from services.storage import storage_service, FileInfo, PresignedURLData
from deps import PermissionChecker
from core.permissions import Permissions
from models.user import User

router = APIRouter()

class PresignedURLsRequest(BaseModel):
    files: List[FileInfo]

class PresignedURLsResponse(BaseModel):
    urls: List[PresignedURLData]

@router.post("/request-upload-urls", response_model=PresignedURLsResponse, status_code=status.HTTP_201_CREATED)
def request_upload_urls(
    request: PresignedURLsRequest,
    current_user: User = Depends(PermissionChecker([Permissions.UPLOAD_PHOTO]))
):
    """
    Request presigned URLs to upload a list of files to S3/MinIO.
    The client should provide a list of desired filenames and their content types.
    A unique object name will be generated for each to avoid collisions.
    """
    try:
        urls_data = storage_service.prepare_upload_urls(request.files)
        return PresignedURLsResponse(urls=urls_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare upload URLs: {str(e)}"
        )

@router.get("/usage", response_model=dict)
def get_storage_usage(
    current_user: User = Depends(PermissionChecker([Permissions.FULL_ACCESS]))
):
    """
    Get the total used space in the storage bucket.
    """
    try:
        return storage_service.get_bucket_usage()
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get bucket usage: {str(e)}"
        )

@router.delete("/cleanup", response_model=dict)
def cleanup_old_files(
    days_older: int,
    current_user: User = Depends(PermissionChecker([Permissions.FULL_ACCESS]))
):
    """
    Delete files from the storage bucket that are older than a specified number of days.
    """
    try:
        return storage_service.delete_old_files(days_older)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup old files: {str(e)}"
        )
