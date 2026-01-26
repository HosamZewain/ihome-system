import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_user_login_with_valid_credentials():
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    data = response.json()
    assert "token" in data, "Response JSON does not contain 'token'"
    assert isinstance(data["token"], str) and data["token"], "'token' is not a non-empty string"

    assert "user" in data, "Response JSON does not contain 'user'"
    user = data["user"]
    assert isinstance(user, dict), "'user' should be a dictionary"

    required_user_fields = ["id", "username", "fullName", "roleId", "permissions"]
    for field in required_user_fields:
        assert field in user, f"'user' does not contain required field '{field}'"

    assert isinstance(user["id"], str) and user["id"], "'id' should be a non-empty string"
    assert isinstance(user["username"], str) and user["username"], "'username' should be a non-empty string"
    assert isinstance(user["fullName"], str) and user["fullName"], "'fullName' should be a non-empty string"
    assert isinstance(user["roleId"], str) and user["roleId"], "'roleId' should be a non-empty string"
    
    permissions = user["permissions"]
    assert isinstance(permissions, list), "'permissions' should be a list"
    for perm in permissions:
        assert isinstance(perm, str), "Each permission should be a string"


test_user_login_with_valid_credentials()