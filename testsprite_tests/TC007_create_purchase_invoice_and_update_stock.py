import requests

BASE_URL = "http://localhost:3001"
AUTH_CREDENTIALS = ("admin", "admin123")
TIMEOUT = 30

def test_create_purchase_invoice_and_update_stock():
    # Step 1: Authenticate to get JWT token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"username": AUTH_CREDENTIALS[0], "password": AUTH_CREDENTIALS[1]}
    login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json().get("token")
    assert token, "JWT token not received"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Step 2: Create a product to purchase (to ensure product exists and we can verify stock update)
    product_payload = {
        "name": "Test Product for Purchase",
        "sku": "TPP-001",
        "category": "Test Category",
        "price": 50.0,
        "cost": 30.0,
        "quantity": 10,
        "description": "Test product created for purchase invoice test"
    }
    product_resp = requests.post(f"{BASE_URL}/api/products", json=product_payload, headers=headers, timeout=TIMEOUT)
    assert product_resp.status_code == 201, f"Product creation failed: {product_resp.text}"
    product_id = product_resp.json().get("id")
    assert product_id, "Product ID not returned on creation"

    # Step 3: Get product details before purchase for stock quantity
    product_get_resp = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=headers, timeout=TIMEOUT)
    assert product_get_resp.status_code == 200, f"Failed to get product details: {product_get_resp.text}"
    product_before = product_get_resp.json()
    initial_quantity = product_before.get("quantity")
    assert isinstance(initial_quantity, int), "Invalid initial quantity value"

    purchase_id = None
    try:
        # Step 4: Create purchase invoice with line item for the created product and quantity to add
        purchase_payload = {
            "supplierId": None,  # Assuming supplierId optional or system default, else would create supplier
            "date": None,  # Assuming server handles date if not provided
            "items": [
                {
                    "productId": product_id,
                    "quantity": 5,
                    "cost": 28.0
                }
            ],
            "notes": "Test purchase invoice creation to update stock"
        }
        # Remove None fields if present because may cause API error
        purchase_payload_clean = {k: v for k, v in purchase_payload.items() if v is not None}

        purchase_resp = requests.post(f"{BASE_URL}/api/purchases", json=purchase_payload_clean, headers=headers, timeout=TIMEOUT)
        assert purchase_resp.status_code == 201, f"Purchase creation failed: {purchase_resp.text}"
        purchase_id = purchase_resp.json().get("id")
        assert purchase_id, "Purchase ID not returned on creation"

        # Step 5: Verify product stock updated (stock should increase by 5)
        updated_product_resp = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=headers, timeout=TIMEOUT)
        assert updated_product_resp.status_code == 200, f"Failed to get product after purchase: {updated_product_resp.text}"
        product_after = updated_product_resp.json()
        updated_quantity = product_after.get("quantity")
        assert isinstance(updated_quantity, int), "Invalid updated quantity value"
        assert updated_quantity == initial_quantity + 5, f"Stock not properly updated: expected {initial_quantity + 5}, got {updated_quantity}"

    finally:
        # Step 6: Cleanup - delete purchase invoice if created
        if purchase_id:
            del_resp = requests.delete(f"{BASE_URL}/api/purchases/{purchase_id}", headers=headers, timeout=TIMEOUT)
            assert del_resp.status_code == 204, f"Failed to delete purchase invoice during cleanup: {del_resp.text}"
        # Cleanup - delete product created
        if product_id:
            del_prod_resp = requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=headers, timeout=TIMEOUT)
            assert del_prod_resp.status_code == 204, f"Failed to delete product during cleanup: {del_prod_resp.text}"

test_create_purchase_invoice_and_update_stock()