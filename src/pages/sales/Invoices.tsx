import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Invoice } from '../../types';
import InvoicePrint from '../../components/sales/InvoicePrint';
import html2pdf from 'html2pdf.js';
import './Sales.css';

export default function Invoices() {
    const { state, updateInvoice, deleteInvoice, dispatch } = useApp();
    const navigate = useNavigate();
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [printTemplate, setPrintTemplate] = useState<'standard' | 'detailed'>('standard');

    // Filter invoices
    const invoices = state.invoices.filter((i) => i.type === 'invoice');
    const filteredInvoices = invoices.filter((inv) => {
        const customerName = inv.customer?.name || '';
        const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleMarkPaid = (invoice: Invoice) => {
        const updated: Invoice = {
            ...invoice,
            status: 'paid',
            paidAt: new Date().toISOString(),
        };
        updateInvoice(updated);

        // Reduce stock
        invoice.items.forEach((item) => {
            const product = state.products.find((p) => p.id === item.productId);
            if (product) {
                dispatch({
                    type: 'UPDATE_STOCK',
                    payload: { productId: item.productId, quantity: Math.max(0, product.quantity - item.quantity) },
                });
            }
        });

        setViewingInvoice(null);
    };

    const handleDelete = (id: string) => {
        deleteInvoice(id);
        setViewingInvoice(null);
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('print-root');
        if (!element || !viewingInvoice) return;

        const opt = {
            margin: 0,
            filename: `Invoice-${viewingInvoice.invoiceNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save();
    };

    const getStatusColor = (status: Invoice['status']) => {
        switch (status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'overdue': return 'error';
            case 'cancelled': return 'error';
            default: return 'primary';
        }
    };

    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    // Stats
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);

    return (
        <div className="sales-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="page-subtitle">Create and manage sales invoices</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/sales/invoices/new')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="invoice-stats">
                <div className="invoice-stat glass-card">
                    <span className="stat-value text-success">{formatCurrency(totalRevenue)}</span>
                    <span className="stat-label">Total Collected</span>
                </div>
                <div className="invoice-stat glass-card">
                    <span className="stat-value text-warning">{formatCurrency(pendingAmount)}</span>
                    <span className="stat-label">Pending</span>
                </div>
                <div className="invoice-stat glass-card">
                    <span className="stat-value">{invoices.length}</span>
                    <span className="stat-label">Total Invoices</span>
                </div>
            </div>

            {/* Filters */}
            <div className="filters glass-card">
                <div className="search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="form-input status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Invoices Table */}
            <div className="glass-card table-container">
                {filteredInvoices.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td><strong>{invoice.invoiceNumber}</strong></td>
                                    <td>{invoice.customer?.name || 'Unknown'}</td>
                                    <td>{formatDate(invoice.createdAt)}</td>
                                    <td>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</td>
                                    <td className="amount">{formatCurrency(invoice.total)}</td>
                                    <td>
                                        <span className={`badge badge-${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setViewingInvoice(invoice)}
                                            >
                                                View
                                            </button>
                                            {invoice.status === 'pending' && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleMarkPaid(invoice)}
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="empty-icon">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <h3>No invoices yet</h3>
                        <p>Create your first invoice or convert a quotation</p>
                        <button className="btn btn-primary" onClick={() => navigate('/sales/invoices/new')}>
                            New Invoice
                        </button>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewingInvoice && (
                <div className="modal-backdrop" onClick={() => setViewingInvoice(null)}>
                    <div className="modal modal-lg glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{viewingInvoice.invoiceNumber}</h2>
                                <span className={`badge badge-${getStatusColor(viewingInvoice.status)}`}>
                                    {viewingInvoice.status}
                                </span>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setViewingInvoice(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="invoice-detail">
                                <div className="detail-row">
                                    <div className="detail-section">
                                        <h4>Customer</h4>
                                        <p><strong>{viewingInvoice.customer?.name || 'Unknown'}</strong></p>
                                        {viewingInvoice.customer?.email && <p>{viewingInvoice.customer.email}</p>}
                                        {viewingInvoice.customer?.phone && <p>{viewingInvoice.customer.phone}</p>}
                                    </div>
                                    <div className="detail-section">
                                        <h4>Dates</h4>
                                        <p>Created: {formatDate(viewingInvoice.createdAt)}</p>
                                        {viewingInvoice.dueDate && <p>Due: {formatDate(viewingInvoice.dueDate)}</p>}
                                        {viewingInvoice.paidAt && <p>Paid: {formatDate(viewingInvoice.paidAt)}</p>}
                                    </div>
                                </div>
                                <div className="detail-section">
                                    <h4>Items</h4>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingInvoice.items.map((item) => (
                                                <tr key={item.productId}>
                                                    <td>{item.productName}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unitPrice)}</td>
                                                    <td>{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="totals-section">
                                    <div className="total-row">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                                    </div>
                                    {viewingInvoice.discount > 0 && (
                                        <div className="total-row discount">
                                            <span>Discount ({viewingInvoice.discount}%)</span>
                                            <span>-{formatCurrency(viewingInvoice.subtotal * viewingInvoice.discount / 100)}</span>
                                        </div>
                                    )}
                                    <div className="total-row grand-total">
                                        <span>Total</span>
                                        <span>{formatCurrency(viewingInvoice.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-medium text-muted">Print Template:</label>
                                <select
                                    className="form-input text-sm"
                                    style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
                                    value={printTemplate}
                                    onChange={(e) => setPrintTemplate(e.target.value as 'standard' | 'detailed')}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="detailed">Detailed (with Discount)</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-danger" onClick={() => handleDelete(viewingInvoice.id)}>
                                    Delete
                                </button>
                                {viewingInvoice.status === 'pending' && (
                                    <button className="btn btn-success" onClick={() => handleMarkPaid(viewingInvoice)}>
                                        Mark as Paid
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={() => window.print()}>
                                    Print
                                </button>
                                <button className="btn btn-primary" onClick={handleDownloadPDF}>
                                    📥 Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Container - Hidden on screen, visible on print */}
            {viewingInvoice && (
                <div id="print-root">
                    <InvoicePrint invoice={viewingInvoice} template={printTemplate} />
                </div>
            )}
        </div>
    );
}
