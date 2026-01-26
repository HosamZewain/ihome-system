import requests

BASE_URL = "http://localhost:3001"
AUTH_CREDENTIALS = ("admin", "admin123")
TIMEOUT = 30

def test_create_expense_with_category():
    auth_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": AUTH_CREDENTIALS[0], "password": AUTH_CREDENTIALS[1]},
        timeout=TIMEOUT,
    )
    assert auth_response.status_code == 200, f"Authentication failed: {auth_response.text}"
    token = auth_response.json().get("token")
    assert token, "Token not found in authentication response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Step 1: Create an expense category (necessary for creating expense with category)
    category_payload = {"name": "TestCategoryForExpense"}
    create_category_resp = requests.post(
        f"{BASE_URL}/api/expenses/categories",
        json=category_payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    assert create_category_resp.status_code == 201, f"Failed to create expense category: {create_category_resp.text}"
    category_id = create_category_resp.json().get("id")
    assert category_id, "Category ID not returned"

    expense_id = None
    try:
        # Step 2: Create expense with the created category
        expense_payload = {
            "amount": 123.45,
            "description": "Test expense with category",
            "categoryId": category_id
        }
        create_expense_resp = requests.post(
            f"{BASE_URL}/api/expenses",
            json=expense_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_expense_resp.status_code == 201, f"Failed to create expense: {create_expense_resp.text}"
        expense_data = create_expense_resp.json()
        expense_id = expense_data.get("id")
        assert expense_id, "Expense ID not returned"
        # Verify returned expense data contains correct category association
        assert expense_data.get("categoryId") == category_id or (
            expense_data.get("category") and expense_data.get("category").get("id") == category_id
        ), "Expense category ID mismatch"
        assert expense_data.get("amount") == expense_payload["amount"], "Expense amount mismatch"
        assert expense_data.get("description") == expense_payload["description"], "Expense description mismatch"

    finally:
        # Cleanup: delete the created expense and category to maintain test isolation
        if expense_id:
            del_expense_resp = requests.delete(
                f"{BASE_URL}/api/expenses/{expense_id}",
                headers=headers,
                timeout=TIMEOUT,
            )
            assert del_expense_resp.status_code == 204, f"Failed to delete expense: {del_expense_resp.text}"

        if category_id:
            del_category_resp = requests.delete(
                f"{BASE_URL}/api/expenses/categories/{category_id}",
                headers=headers,
                timeout=TIMEOUT,
            )
            assert del_category_resp.status_code == 204, f"Failed to delete expense category: {del_category_resp.text}"

test_create_expense_with_category()