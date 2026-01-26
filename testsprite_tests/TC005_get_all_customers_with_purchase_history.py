import requests

BASE_URL = "http://localhost:3001"
AUTH_CREDENTIALS = ("admin", "admin123")
TIMEOUT = 30

def test_get_all_customers_with_purchase_history():
    session = requests.Session()
    try:
        # Authenticate to get token
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": AUTH_CREDENTIALS[0], "password": AUTH_CREDENTIALS[1]},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token and isinstance(token, str), "Token missing or invalid in login response"

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Call GET /api/customers to get all customers with purchase history
        resp = session.get(f"{BASE_URL}/api/customers", headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}"
        customers = resp.json()
        assert isinstance(customers, list), "Response is not a list"

        # Validate each customer has expected structure with invoices
        for customer in customers:
            assert isinstance(customer, dict), "Customer entry is not a dict"
            # Check mandatory customer fields presence
            assert "id" in customer, "Customer missing 'id'"
            assert "name" in customer or "fullName" in customer or "username" in customer, "Customer missing a name field"
            # Check purchase history/invoices presence (can be empty list)
            assert "invoices" in customer or "purchaseHistory" in customer or "purchase_history" in customer or "invoices" in customer, "Customer missing purchase history or invoices field"
            # If invoices field exists, it should be a list
            invoices_field = None
            for key in ["invoices", "purchaseHistory", "purchase_history"]:
                if key in customer:
                    invoices_field = customer[key]
                    break
            if invoices_field is not None:
                assert isinstance(invoices_field, list), "'invoices' field is not a list"
            
    finally:
        session.close()

test_get_all_customers_with_purchase_history()