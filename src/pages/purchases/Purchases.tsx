import { useState, useEffect } from 'react';
import '../Products.css';
import { useApp } from '../../context/AppContext';
import { suppliersApi, purchasesApi } from '../../services/api';
import '../sales/Sales.css';

interface Supplier {
    id: string;
    name: string;
}

interface PurchaseItem {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    total: number;
}

interface Purchase {
    id: string;
    invoiceNumber: string;
    supplier: Supplier;
    status: string;
    subtotal: number;
    total: number;
    items: PurchaseItem[];
    createdAt: string;
}

export default function Purchases() {
    const { state, refreshData, importData } = useApp();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [notes, setNotes] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [purchasesData, suppliersData] = await Promise.all([
                purchasesApi.getAll(),
                suppliersApi.getAll(),
            ]);
            setPurchases(purchasesData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { productId: '', productName: '', quantity: 1, unitCost: 0, total: 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;

        if (field === 'productId') {
            const product = state.products.find(p => p.id === value);
            if (product) {
                updated[index].productName = product.name;
                updated[index].unitCost = product.costPrice || 0;
            }
        }

        updated[index].total = updated[index].quantity * updated[index].unitCost;
        setItems(updated);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier || items.length === 0) {
            alert('Please select a supplier and add at least one item');
            return;
        }

        try {
            const purchase = {
                invoiceNumber: `PO-${Date.now()}`,
                supplier: selectedSupplier,
                status: 'received',
                subtotal: calculateTotal(),
                total: calculateTotal(),
                notes,
                items,
            };
            await purchasesApi.create(purchase);
            await loadData();
            await refreshData(); // Refresh products to show updated stock
            closeModal();
        } catch (error) {
            console.error('Failed to create purchase:', error);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        try {
            await importData('purchases', importFile);
            alert('Purchases imported successfully!');
            setIsImportModalOpen(false);
            setImportFile(null);
            await loadData();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import purchases. Please check the CSV format.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this purchase? Stock changes will not be reversed.')) {
            try {
                await purchasesApi.delete(id);
                await loadData();
            } catch (error) {
                console.error('Failed to delete purchase:', error);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSupplier(null);
        setItems([]);
        setNotes('');
    };

    if (loading) {
        return <div className="page-loading">Loading purchases...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Purchase Invoices</h1>
                    <p className="text-muted">Record product purchases from suppliers</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + New Purchase
                    </button>
                </div>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Supplier</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th className="text-right">Total</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state-container">
                                        <div className="empty-state-icon">📝</div>
                                        <p>No purchase orders found. Create your first purchase order to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            purchases.map((purchase) => (
                                <tr key={purchase.id}>
                                    <td className="font-medium" style={{ fontFamily: 'monospace' }}>
                                        {purchase.invoiceNumber}
                                    </td>
                                    <td>
                                        <span className="font-medium">
                                            {purchase.supplier?.name || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm text-muted">
                                            {purchase.items?.length || 0} items
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${purchase.status}`}>
                                            {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="text-sm text-muted">
                                        {new Date(purchase.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="text-right font-medium text-success">
                                        EGP {purchase.total.toFixed(2)}
                                    </td>
                                    <td>
                                        <div className="cell-actions">
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleDelete(purchase.id)}
                                                title="Delete Purchase"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Purchase Order</h2>
                            <button className="btn btn-ghost" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Supplier *</label>
                                <select
                                    className="form-input"
                                    value={selectedSupplier?.id || ''}
                                    onChange={(e) => {
                                        const supplier = suppliers.find(s => s.id === e.target.value);
                                        setSelectedSupplier(supplier || null);
                                    }}
                                    required
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="items-section">
                                <div className="items-header">
                                    <h3>Products</h3>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                                        + Add Product
                                    </button>
                                </div>

                                {items.length === 0 ? (
                                    <p className="text-muted text-center">Add products to this purchase</p>
                                ) : (
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Unit Cost</th>
                                                <th>Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <select
                                                            className="form-input"
                                                            value={item.productId}
                                                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Select Product</option>
                                                            {state.products.map((product) => (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.unitCost}
                                                            onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="text-right">
                                                        EGP {item.total.toFixed(2)}
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                <div className="total-row">
                                    <strong>Total: EGP {calculateTotal().toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional notes..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Purchase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsImportModalOpen(false)}>
                    <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Import Purchases</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsImportModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleImport}>
                            <div className="modal-body">
                                <p className="mb-4">Select a CSV file to import purchase invoices. Headers: <code>invoiceNumber, supplierName, status, notes, productName, productId, quantity, unitCost</code></p>
                                <div className="form-group">
                                    <label className="form-label">CSV File</label>
                                    <input
                                        type="file"
                                        className="form-input"
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={!importFile}>
                                    Start Import
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
