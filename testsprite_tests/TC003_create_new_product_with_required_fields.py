import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
AUTH_USERNAME = "admin"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30

def test_create_new_product_with_required_fields():
    # Login to get JWT token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "username": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    try:
        login_response = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        token = login_response.json().get("token")
        assert token, "Token not found in login response"
    except Exception as e:
        raise AssertionError(f"Login request failed: {str(e)}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    product_url = f"{BASE_URL}/api/products"
    product_payload = {
        "name": "Test Product TC003"
    }

    created_product_id = None
    try:
        response = requests.post(product_url, headers=headers, json=product_payload, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        response_json = response.json()
        # We expect at least an id or similar to be returned, but since PRD example doesn't specify,
        # let's check the response contains the name created.
        assert "name" in response_json and response_json["name"] == product_payload["name"], "Product name mismatch in response"
        # Attempt to get product id for cleanup
        created_product_id = response_json.get("id") or response_json.get("_id")
    finally:
        # Cleanup: delete created product if ID is present
        if created_product_id:
            delete_url = f"{BASE_URL}/api/products/{created_product_id}"
            try:
                delete_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                assert delete_resp.status_code == 204, f"Failed to delete product, status code {delete_resp.status_code}"
            except Exception:
                pass  # Avoid raising error on cleanup

test_create_new_product_with_required_fields()