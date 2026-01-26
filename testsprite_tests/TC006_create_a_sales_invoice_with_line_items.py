import requests

BASE_URL = "http://localhost:3001"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
INVOICES_URL = f"{BASE_URL}/api/invoices"
PRODUCTS_URL = f"{BASE_URL}/api/products"

USERNAME = "admin"
PASSWORD = "admin123"
TIMEOUT = 30

def test_create_sales_invoice_with_line_items():
    # Step 1: Obtain JWT token via login
    login_payload = {"username": USERNAME, "password": PASSWORD}
    login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json().get("token")
    assert token, "JWT token not found in login response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Step 2: Create a product to use as line item in the invoice
    product_payload = {
        "name": "Test Product for Invoice",
        "sku": "TP-INV-001",
        "category": "Test Category",
        "price": 50.0,
        "cost": 30.0,
        "quantity": 100,
        "description": "Product created for invoice line item testing"
    }
    product_resp = requests.post(PRODUCTS_URL, json=product_payload, headers=headers, timeout=TIMEOUT)
    assert product_resp.status_code == 201, f"Failed to create product: {product_resp.text}"
    product_id = product_resp.json().get("id")
    assert product_id, "Product ID not returned after creation"

    invoice_id = None
    try:
        # Step 3: Create the invoice with line items referencing the product
        invoice_payload = {
            "date": "2026-01-21",
            "dueDate": "2026-02-21",
            "notes": "Automated test invoice with line items",
            "lineItems": [
                {
                    "productId": product_id,
                    "quantity": 2,
                    "unitPrice": 50.0,
                    "description": "Test line item for product"
                }
            ]
        }
        invoice_resp = requests.post(INVOICES_URL, json=invoice_payload, headers=headers, timeout=TIMEOUT)
        assert invoice_resp.status_code == 201, f"Invoice creation failed: {invoice_resp.text}"
        invoice_data = invoice_resp.json()
        invoice_id = invoice_data.get("id")
        assert invoice_id, "Invoice ID not returned after creation"

    finally:
        # Step 4: Clean up created resources
        if invoice_id:
            requests.delete(f"{INVOICES_URL}/{invoice_id}", headers=headers, timeout=TIMEOUT)
        if product_id:
            requests.delete(f"{PRODUCTS_URL}/{product_id}", headers=headers, timeout=TIMEOUT)

test_create_sales_invoice_with_line_items()
