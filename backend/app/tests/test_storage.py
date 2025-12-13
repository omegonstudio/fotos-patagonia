from fastapi.testclient import TestClient
import pytest

# Note: The module-level client is removed to use authenticated fixtures instead.

def test_request_single_upload_url(photographer_client: TestClient):
    """
    Test requesting a single presigned URL.
    """
    request_body = {
        "files": [{"filename": "test_image.jpg", "contentType": "image/jpeg"}]
    }
    response = photographer_client.post("/request-upload-urls", json=request_body)
    
    assert response.status_code == 201, response.text
    data = response.json()
    
    assert "urls" in data
    assert len(data["urls"]) == 1
    
    url_data = data["urls"][0]
    assert "upload_url" in url_data
    assert "object_name" in url_data
    assert url_data["original_filename"] == "test_image.jpg"
    
    # Check if the URL looks like a valid presigned URL for S3
    # The exact endpoint URL depends on the test setup (minio vs localhost)
    assert "X-Amz-Algorithm" in url_data["upload_url"]
    assert "X-Amz-Credential" in url_data["upload_url"]
    assert "X-Amz-Date" in url_data["upload_url"]
    assert "X-Amz-Expires" in url_data["upload_url"]
    assert "X-Amz-SignedHeaders=content-type%3Bhost" in url_data["upload_url"] # Semicolon is URL-encoded
    assert "X-Amz-Signature" in url_data["upload_url"]

def test_request_multiple_upload_urls(photographer_client: TestClient):
    """
    Test requesting multiple presigned URLs in a single request.
    """
    request_body = {
        "files": [
            {"filename": "photo1.png", "contentType": "image/png"},
            {"filename": "photo2.jpeg", "contentType": "image/jpeg"}
        ]
    }
    response = photographer_client.post("/request-upload-urls", json=request_body)
    
    assert response.status_code == 201, response.text
    data = response.json()
    
    assert "urls" in data
    assert len(data["urls"]) == 2
    
    for i, url_data in enumerate(data["urls"]):
        assert url_data["original_filename"] == request_body["files"][i]["filename"]
        assert "upload_url" in url_data
        assert "object_name" in url_data

def test_request_upload_url_empty_list(photographer_client: TestClient):
    """
    Test that requesting URLs with an empty list of files fails.
    """
    request_body = {
        "files": []
    }
    response = photographer_client.post("/request-upload-urls", json=request_body)
    assert response.status_code == 400
    assert "File list cannot be empty" in response.json()["detail"]

def test_request_upload_url_bad_body(photographer_client: TestClient):
    """
    Test that a malformed request body fails.
    """
    # Using a body that doesn't match the expected Pydantic model
    response = photographer_client.post("/request-upload-urls", json={"filenames": ["test.jpg"]})
    assert response.status_code == 422 # Unprocessable Entity