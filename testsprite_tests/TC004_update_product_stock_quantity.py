import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
AUTH_USERNAME = "admin"
AUTH_PASSWORD = "admin123"
TIMEOUT = 30

def test_update_product_stock_quantity():
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {'Content-Type': 'application/json'}
    product_id = None
    try:
        # Step 1: Create a new product to update stock on
        create_product_payload = {
            "name": "TestProductForStockUpdate",
            "sku": "TSKU12345",
            "category": "TestCategory",
            "price": 10.0,
            "cost": 7.0,
            "quantity": 5,
            "description": "Product created for stock update test"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/products",
            json=create_product_payload,
            auth=auth,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Expected 201 on product creation, got {create_resp.status_code}"
        product_data = create_resp.json()
        assert 'id' in product_data, "Product creation response missing 'id'"
        product_id = product_data['id']

        # Step 2: Update the product stock quantity
        new_stock_quantity = 20
        patch_payload = { "quantity": new_stock_quantity }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/products/{product_id}/stock",
            json=patch_payload,
            auth=auth,
            headers=headers,
            timeout=TIMEOUT
        )
        assert patch_resp.status_code == 200, f"Expected 200 on stock update, got {patch_resp.status_code}"

        # Step 3: Retrieve product details to verify stock update
        get_resp = requests.get(
            f"{BASE_URL}/api/products/{product_id}",
            auth=auth,
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Expected 200 on get product, got {get_resp.status_code}"
        product_detail = get_resp.json()
        assert 'quantity' in product_detail, "Product detail missing 'quantity'"
        assert product_detail['quantity'] == new_stock_quantity, f"Stock quantity mismatch: expected {new_stock_quantity}, got {product_detail['quantity']}"

    finally:
        if product_id:
            # Cleanup: Delete the created product
            del_resp = requests.delete(
                f"{BASE_URL}/api/products/{product_id}",
                auth=auth,
                headers=headers,
                timeout=TIMEOUT
            )
            assert del_resp.status_code == 204, f"Expected 204 on product deletion, got {del_resp.status_code}"

test_update_product_stock_quantity()