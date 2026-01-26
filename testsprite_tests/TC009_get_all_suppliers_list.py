import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
AUTH = HTTPBasicAuth("admin", "admin123")
TIMEOUT = 30

def test_get_all_suppliers_list():
    url = f"{BASE_URL}/api/suppliers"
    try:
        response = requests.get(url, auth=AUTH, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        suppliers = response.json()
        assert isinstance(suppliers, list), "Response should be a list"
        if suppliers:
            for supplier in suppliers:
                assert isinstance(supplier, dict), "Each supplier should be a dictionary"
                # Check expected keys in supplier details (at least id or name or similar)
                # Since schema details are not specified for supplier attributes, check common plausible keys
                assert 'id' in supplier or 'name' in supplier, "Supplier details must contain 'id' or 'name'"
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"Request failed: {e}")

test_get_all_suppliers_list()