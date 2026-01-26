import pandas as pd
import requests
import json
import os
import math

API_BASE = 'http://localhost:3001/api'

def get_products_lookup():
    """Fetch all products and return lookup dicts by SKU and Name"""
    print("Fetching products for lookup...")
    try:
        res = requests.get(f"{API_BASE}/products")
        if res.status_code != 200:
            print("Failed to fetch products")
            return {}, {}
        
        products = res.json()
        by_sku = {}
        by_name = {}
        
        for p in products:
            if p.get('sku'):
                by_sku[str(p['sku'])] = p
            if p.get('name'):
                by_name[p['name']] = p
                
        print(f"Loaded {len(products)} products for lookup")
        return by_sku, by_name
    except Exception as e:
        print(f"Error fetching products: {e}")
        return {}, {}

def get_or_create_product(sku, name, category, cost, price, by_sku, by_name):
    """Find product or create if missing"""
    product = None
    
    # Try find by SKU
    if sku and str(sku) in by_sku:
        product = by_sku[str(sku)]
    # Try find by Name
    elif name in by_name:
        product = by_name[name]
        
    if product:
        return product['id']

    # Create new product
    print(f"Creating missing product: {name} (SKU: {sku})")
    try:
        payload = {
            'name': name,
            'sku': str(sku) if sku else '',
            'category': category or 'Uncategorized',
            'quantity': 0, # Will be set by purchase
            'costPrice': cost or 0,
            'price': price or 0,
            'description': 'Created during history import'
        }
        res = requests.post(f"{API_BASE}/products", json=payload)
        if res.status_code == 201:
            new_prod = res.json()
            # Update lookups
            if new_prod.get('sku'):
                by_sku[str(new_prod['sku'])] = new_prod
            by_name[new_prod['name']] = new_prod
            return new_prod['id']
        else:
            print(f"Failed to create product {name}: {res.text}")
            return None
    except Exception as e:
        print(f"Error creating product {name}: {e}")
        return None

def import_purchases(by_sku, by_name):
    print("\n--- Importing Purchases ---")
    try:
        df = pd.read_csv('/Users/hosam/Desktop/dev/iHomeSystem/Purchase Invoice.csv')
    except Exception as e:
        print(f"Error reading Purchase Invoice.csv: {e}")
        return

    # Group by Invoice ID
    grouped = df.groupby('ID')
    
    success_count = 0
    fail_count = 0
    
    # Create suppliers cache
    suppliers_cache = {} # name -> id

    for invoice_id, group in grouped:
        first_row = group.iloc[0]
        supplier_name = first_row['Supplier']
        date = first_row['Date']
        
        # 1. Get or Create Supplier
        supplier_id = suppliers_cache.get(supplier_name)
        
        if not supplier_id:
            try:
                # List all suppliers to find match (inefficient but safe)
                # Optimization: do this once globally or assumed create works duplicate-check
                # Since we reset DB, suppliers table is empty. But previous loops might have added some.
                # Just try create, if strictly duplicates allowed? 
                # Better: Fetch all suppliers once? No, just caching locally is fine for run.
                
                # Check API?
                # Let's just create and if it exists we might duplicate, but suppliers names are usually distinct.
                # Actually, let's try to fetch list first? No, let's just create.
                # Wait, "suppliers" table has no UNIQUE constraint on name in my DB script.
                # So I should check if it exists in my local cache OR fetch from API.
                
                # Retrieve all suppliers from API to fill cache if empty
                if not suppliers_cache:
                     res = requests.get(f"{API_BASE}/suppliers")
                     if res.ok:
                         for s in res.json():
                             suppliers_cache[s['name']] = s['id']
                             
                supplier_id = suppliers_cache.get(supplier_name)
                
                if not supplier_id:
                    res = requests.post(f"{API_BASE}/suppliers", json={
                        'name': supplier_name,
                        'email': '',
                        'phone': '',
                        'address': ''
                    })
                    if res.status_code == 201:
                        supplier_id = res.json()['id']
                        suppliers_cache[supplier_name] = supplier_id
                    else:
                        print(f"Failed to create supplier {supplier_name}: {res.text}")
                        continue
            except Exception as e:
                print(f"Error supplier: {e}")
                continue

        # 2. Build Invoice Items
        items = []
        total_amount = 0
        
        for _, row in group.iterrows():
            item_code = str(row['Item (Items)']) # SKU
            # Clean up SKU (remove .0 if float parsed as string)
            if item_code.endswith('.0'):
                item_code = item_code[:-2]
                
            item_name = row['Item Name (Items)']
            category = row['Item Group (Items)']
            qty = float(row['Accepted Qty (Items)']) if pd.notna(row['Accepted Qty (Items)']) else 0
            rate = float(row['Rate (Items)']) if pd.notna(row['Rate (Items)']) else 0
            
            product_id = get_or_create_product(
                item_code, item_name, category, 
                cost=rate, price=rate*1.3, 
                by_sku=by_sku, by_name=by_name
            )
            
            if not product_id:
                print(f"Skipping item {item_name} - could not resolve product")
                continue
                
            line_total = qty * rate
            total_amount += line_total
            
            items.append({
                'productId': product_id,
                'productName': item_name,
                'quantity': qty,
                'unitCost': rate,
                'total': line_total
            })
            
        if not items:
            continue
            
        payload = {
            'invoiceNumber': str(invoice_id),
            'supplier': {'id': supplier_id, 'name': supplier_name},
            'items': items,
            'status': 'received',
            'subtotal': total_amount,
            'total': total_amount,
            'notes': f'Imported from {invoice_id}. Date: {date}'
        }
        
        try:
            res = requests.post(f"{API_BASE}/purchases", json=payload)
            if res.status_code == 201:
                print(f"✓ Created Purchase {invoice_id}")
                success_count += 1
            else:
                print(f"✗ Failed Purchase {invoice_id}: {res.text}")
                fail_count += 1
        except Exception as e:
            print(f"✗ Error Purchase {invoice_id}: {e}")
            fail_count += 1

    print(f"Purchases Import: {success_count} success, {fail_count} failed")

def import_sales(by_sku, by_name):
    print("\n--- Importing Sales ---")
    try:
        df = pd.read_csv('/Users/hosam/Desktop/dev/iHomeSystem/Sales Invoice (1).csv')
    except Exception as e:
        print(f"Error reading Sales Invoice.csv: {e}")
        return

    if 'ID' in df.columns:
        df['ID'] = df['ID'].ffill() # Use generic pandas method if method='ffill' deprecated
    
    grouped = df.groupby('ID')
    
    success_count = 0
    fail_count = 0
    
    customers_cache = {}

    for invoice_id, group in grouped:
        # Skip rows that don't have item details AND don't have customer details
        # The first row usually has Customer Name
        header_row = group.iloc[0]
        customer_name = header_row['Customer Name']
        
        if pd.isna(customer_name):
            # Try find in group
            potential = group['Customer Name'].dropna()
            if not potential.empty:
                customer_name = potential.iloc[0]
            else:
                print(f"Skipping {invoice_id}: No customer name")
                continue
                
        date = header_row['Date']
        
        # 1. Get or Create Customer
        customer_id = customers_cache.get(customer_name)
        
        if not customer_id:
             # Refresh cache
             if not customers_cache:
                 res = requests.get(f"{API_BASE}/customers")
                 if res.ok:
                     for c in res.json():
                         customers_cache[c['name']] = c['id']
            
             customer_id = customers_cache.get(customer_name)
             if not customer_id:
                try:
                    res = requests.post(f"{API_BASE}/customers", json={
                        'name': customer_name,
                        'type': 'company' if 'Company' in str(header_row['Customer']) else 'individual' # Guess
                    })
                    if res.status_code == 201:
                        customer_id = res.json()['id']
                        customers_cache[customer_name] = customer_id
                    else:
                        print(f"Failed create customer {customer_name}: {res.text}")
                        continue
                except:
                    continue

        # 2. Build Items
        items = []
        total_amount = 0
        
        for _, row in group.iterrows():
            if pd.isna(row['Item Name (Items)']):
                continue
            
            raw_sku = str(row['Item (Items)'])
            if raw_sku == 'nan': raw_sku = ''
            if raw_sku.endswith('.0'): raw_sku = raw_sku[:-2]
            
            item_name = row['Item Name (Items)']
            
            qty = float(row['Quantity (Items)']) if pd.notna(row['Quantity (Items)']) else 1.0
            rate = float(row['Rate (Items)']) if pd.notna(row['Rate (Items)']) else 0
            
            # Lookup product
            product_id = get_or_create_product(
                raw_sku, item_name, 'Uncategorized', 
                cost=rate*0.7, price=rate, 
                by_sku=by_sku, by_name=by_name
            )
            
            if not product_id:
                continue
                
            line_total = qty * rate
            total_amount += line_total
            
            items.append({
                'productId': product_id,
                'productName': item_name,
                'quantity': qty,
                'unitPrice': rate,
                'total': line_total
            })

        if not items:
            continue

        payload = {
            'invoiceNumber': str(invoice_id),
            'customer': {'id': customer_id, 'name': customer_name},
            'items': items,
            'type': 'invoice',
            'status': 'paid',
            'subtotal': total_amount,
            'total': total_amount,
            'notes': f'Imported from {invoice_id}. Date: {date}'
        }
        
        try:
            res = requests.post(f"{API_BASE}/invoices", json=payload)
            if res.status_code == 201:
                print(f"✓ Created Sales Invoice {invoice_id}")
                success_count += 1
            else:
                print(f"✗ Failed Sales {invoice_id}: {res.text}")
                fail_count += 1
        except Exception as e:
            print(f"✗ Error Sales {invoice_id}: {e}")
            fail_count += 1
            
    print(f"Sales Import: {success_count} success, {fail_count} failed")

if __name__ == "__main__":
    by_sku, by_name = get_products_lookup()
    import_purchases(by_sku, by_name)
    import_sales(by_sku, by_name)
