import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Invoice, InvoiceItem, Customer } from '../../types';
import './Sales.css';

export default function CreateInvoice() {
    const { state, addInvoice, addCustomer } = useApp();
    const navigate = useNavigate();

    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemDiscount, setItemDiscount] = useState(0);

    // Global Discount State
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');

    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Customer Modal State
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', type: 'individual' as 'individual' | 'company', details: '' });

    const handleAddItem = () => {
        const product = state.products.find((p) => p.id === selectedProduct);
        if (!product) return;

        const baseTotal = product.price * quantity;
        const finalTotal = Math.max(0, baseTotal - itemDiscount);

        const newItem: InvoiceItem = {
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            discount: itemDiscount,
            total: finalTotal,
        };

        setItems([...items, newItem]);
        setSelectedProduct('');
        setQuantity(1);
        setItemDiscount(0);
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter((i) => i.productId !== productId));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, i) => sum + i.total, 0);
        let discountAmount = 0;

        if (discountType === 'percentage') {
            discountAmount = subtotal * (discountValue / 100);
        } else {
            discountAmount = discountValue;
        }

        const total = Math.max(0, subtotal - discountAmount);
        return { subtotal, discountAmount, total };
    };

    const handleCreateCustomer = async () => {
        const customer = {
            id: `cust-${Date.now()}`,
            name: newCustomer.name,
            phone: newCustomer.phone,
            address: newCustomer.address,
            type: newCustomer.type,
            details: newCustomer.details
        };
        addCustomer(customer);

        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);

        setShowNewCustomerModal(false);
        setNewCustomer({ name: '', phone: '', address: '', type: 'individual', details: '' });
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { subtotal, total, discountAmount } = calculateTotals();

            let customer: Customer | undefined = state.customers.find(
                (c) => c.name.toLowerCase() === customerName.toLowerCase()
            );

            if (!customer) {
                // Since addCustomer is async and returns via dispatch, we need to be careful
                // For simplicity and to avoid race conditions, we can wait for it or use a separate logic
                // For now, let's just make sure both are awaited
                await addCustomer({
                    name: customerName,
                    phone: customerPhone,
                });

                // Refresh customer reference from updated state is tricky because of stale closure
                // But addInvoice handles customer object
                customer = {
                    id: `cust-${Date.now()}`, // Temporary local ID
                    name: customerName,
                    phone: customerPhone,
                };
            }

            const invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'> = {
                type: 'invoice',
                customer,
                items,
                subtotal,
                discount: discountAmount,
                discountType,
                discountValue,
                tax: 0,
                total,
                status: 'pending',
                notes,
                dueDate: dueDate || undefined,
            };

            await addInvoice(invoice);
            navigate('/sales/invoices');
        } catch (error) {
            console.error('Failed to create invoice:', error);
            alert('Failed to create invoice. Please check the information and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;
    const { subtotal, total, discountAmount } = calculateTotals();

    return (
        <div className="sales-page create-invoice-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <button onClick={() => navigate('/sales/invoices')} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem' }}>
                        ← Back to Invoices
                    </button>
                    <h1 className="page-title">Create New Invoice</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/sales/invoices')} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        id="save-invoice-btn"
                        onClick={handleSubmit}
                        disabled={items.length === 0 || !customerName || isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Invoice'}
                    </button>
                </div>
            </div>

            {/* Two-Column Layout */}
            <div className="invoice-layout">
                {/* LEFT: Main Form */}
                <div className="invoice-main-column">

                    {/* Customer Card */}
                    <div className="invoice-card">
                        <div className="invoice-card-header">
                            <h3 className="card-title">Customer Information</h3>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewCustomerModal(true)}>
                                + New Customer
                            </button>
                        </div>
                        <div className="invoice-card-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Customer Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={customerName}
                                        onChange={(e) => {
                                            setCustomerName(e.target.value);
                                            const existing = state.customers.find(c => c.name === e.target.value);
                                            if (existing) {
                                                setCustomerPhone(existing.phone || '');
                                            }
                                        }}
                                        list="customers"
                                        placeholder="Search or type name..."
                                    />
                                    <datalist id="customers">
                                        {state.customers.map((c) => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="invoice-card">
                        <div className="invoice-card-header">
                            <h3 className="card-title">Invoice Items</h3>
                            <span className="text-muted text-sm">{items.length} item(s)</span>
                        </div>
                        <div className="invoice-card-body">
                            {/* Add Item Row */}
                            <div className="product-selector">
                                <div className="form-group">
                                    <label className="form-label">Product</label>
                                    <select className="form-input" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                                        <option value="">Select a product...</option>
                                        {state.products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({formatCurrency(p.price)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Qty</label>
                                    <input type="number" className="form-input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Disc.</label>
                                    <input type="number" className="form-input" value={itemDiscount} onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)} min="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total</label>
                                    <div style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-success-400)' }}>
                                        {selectedProduct ? formatCurrency(((state.products.find(p => p.id === selectedProduct)?.price || 0) * quantity) - itemDiscount) : '-'}
                                    </div>
                                </div>
                                <div style={{ paddingTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-primary" onClick={handleAddItem} disabled={!selectedProduct}>
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Items Table */}
                            {items.length > 0 ? (
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th className="col-qty">Qty</th>
                                            <th className="col-price">Price</th>
                                            <th className="col-disc">Disc.</th>
                                            <th className="col-total">Total</th>
                                            <th className="col-action"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={`${item.productId}-${index}`}>
                                                <td>{item.productName}</td>
                                                <td className="col-qty">{item.quantity}</td>
                                                <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                                                <td className="col-disc" style={{ color: 'var(--color-error-400)' }}>
                                                    {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                                                </td>
                                                <td className="col-total" style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                                <td className="col-action">
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveItem(item.productId)}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="items-empty">
                                    <p>No items added yet</p>
                                    <p className="text-sm">Select a product above to start</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Summary */}
                <div className="invoice-side-column">
                    <div className="invoice-card invoice-summary-card">
                        <div className="invoice-card-body">
                            {/* Total Display */}
                            <div className="grand-total-display">
                                <div className="grand-total-label">Total Amount Due</div>
                                <div className="grand-total-amount">{formatCurrency(total)}</div>
                            </div>

                            {/* Settings */}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Due Date</label>
                                <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, thank you note..." />
                            </div>

                            {/* Summary */}
                            <div style={{ borderTop: '1px solid var(--color-slate-700)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>Discount</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                            min="0"
                                        />
                                        <select
                                            className="form-input"
                                            style={{ width: '60px', padding: '0.25rem' }}
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                        >
                                            <option value="fixed">$</option>
                                            <option value="percentage">%</option>
                                        </select>
                                    </div>
                                </div>

                                {discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-error-400)', fontSize: '0.875rem' }}>
                                        <span>Discount Applied</span>
                                        <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-slate-700)', fontWeight: 700, fontSize: '1.125rem' }}>
                                    <span>Total Due</span>
                                    <span style={{ color: 'var(--color-success-400)' }}>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                id="create-invoice-submit-btn"
                                onClick={handleSubmit}
                                disabled={items.length === 0 || !customerName || isSubmitting}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Customer Modal */}
            {showNewCustomerModal && (
                <div className="modal-backdrop">
                    <div className="modal glass-card" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Add New Customer</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowNewCustomerModal(false)}>✕</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateCustomer(); }}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Name *</label>
                                    <input className="form-input" required value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Mobile</label>
                                    <input className="form-input" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Address</label>
                                    <input className="form-input" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={newCustomer.type} onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value as 'individual' | 'company' })}>
                                        <option value="individual">Individual</option>
                                        <option value="company">Company</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-input" rows={2} value={newCustomer.details} onChange={e => setNewCustomer({ ...newCustomer, details: e.target.value })}></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowNewCustomerModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
