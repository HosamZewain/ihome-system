import requests

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
ME_ENDPOINT = f"{BASE_URL}/api/auth/me"
TIMEOUT = 30


def test_get_current_user_information_with_valid_token():
    # Step 1: Login to get JWT token
    login_payload = {
        "username": "admin",
        "password": "admin123"
    }
    login_headers = {
        "Content-Type": "application/json"
    }
    try:
        login_response = requests.post(
            LOGIN_ENDPOINT, json=login_payload, headers=login_headers, timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed - status code {login_response.status_code}"
        login_data = login_response.json()
        assert "token" in login_data, "No token found in login response"
        token = login_data["token"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Login request failed: {e}")

    # Step 2: Call /api/auth/me with valid token
    auth_headers = {
        "Authorization": f"Bearer {token}"
    }
    try:
        me_response = requests.get(ME_ENDPOINT, headers=auth_headers, timeout=TIMEOUT)
        assert me_response.status_code == 200, f"Authorized /api/auth/me failed with status {me_response.status_code}"
        me_data = me_response.json()
        # Validate expected user fields presence
        expected_fields = {"id", "username", "fullName", "roleId", "permissions"}
        assert isinstance(me_data, dict), "/api/auth/me response is not a JSON object"
        assert expected_fields.issubset(me_data.keys()), f"/api/auth/me response missing expected fields: {expected_fields - me_data.keys()}"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Authorized /api/auth/me request failed: {e}")

    # Step 3: Call /api/auth/me with no token (should return 401)
    try:
        no_auth_response = requests.get(ME_ENDPOINT, timeout=TIMEOUT)
        assert no_auth_response.status_code == 401, f"Unauthorized /api/auth/me without token returned {no_auth_response.status_code} instead of 401"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Unauthorized /api/auth/me request without token failed: {e}")

    # Step 4: Call /api/auth/me with invalid token (should return 401)
    invalid_headers = {
        "Authorization": "Bearer invalidtoken123"
    }
    try:
        invalid_auth_response = requests.get(ME_ENDPOINT, headers=invalid_headers, timeout=TIMEOUT)
        assert invalid_auth_response.status_code == 401, f"Unauthorized /api/auth/me with invalid token returned {invalid_auth_response.status_code} instead of 401"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Unauthorized /api/auth/me request with invalid token failed: {e}")


test_get_current_user_information_with_valid_token()