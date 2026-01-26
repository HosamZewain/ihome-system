import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
USERNAME = "admin"
PASSWORD = "admin123"
TIMEOUT = 30


def test_get_all_roles_with_permissions():
    login_url = f"{BASE_URL}/api/auth/login"
    roles_url = f"{BASE_URL}/api/roles"

    # Step 1: Login to get JWT token
    login_payload = {"username": USERNAME, "password": PASSWORD}
    try:
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        assert token, "Token not found in login response"
    except requests.RequestException as e:
        raise AssertionError(f"Login request failed: {e}")

    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Get all roles with permissions
    try:
        roles_resp = requests.get(roles_url, headers=headers, timeout=TIMEOUT)
        assert roles_resp.status_code == 200, f"Failed to get roles: {roles_resp.text}"
        roles_data = roles_resp.json()
        assert isinstance(roles_data, list) or isinstance(roles_data, dict), "Roles response is not a list or dict"

        # Check at least one role with permissions structure
        roles_list = roles_data if isinstance(roles_data, list) else roles_data.get("roles", roles_data)
        assert roles_list, "No roles found in response"

        for role in roles_list:
            assert "id" in role or "roleId" in role, "Role missing id"
            assert "name" in role or "roleName" in role, "Role missing name"
            # Permissions field must be present and be a list
            permissions = role.get("permissions")
            assert permissions is not None, "Role missing permissions field"
            assert isinstance(permissions, list), "Role permissions is not a list"
    except requests.RequestException as e:
        raise AssertionError(f"Get roles request failed: {e}")


test_get_all_roles_with_permissions()