import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Invoice } from '../../types';
import './Sales.css';

export default function Quotations() {
    const { state, deleteInvoice, convertToInvoice } = useApp();
    const navigate = useNavigate();
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter quotations
    const quotations = state.invoices.filter((i) => i.type === 'quotation');
    const filteredQuotations = quotations.filter((q) =>
        q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        navigate('/sales/quotations/new');
    };

    const handleConvert = (id: string) => {
        convertToInvoice(id);
    };

    const handleDelete = (id: string) => {
        deleteInvoice(id);
        setViewingInvoice(null);
    };

    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    return (
        <div className="sales-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quotations</h1>
                    <p className="page-subtitle">Create and manage sales quotations</p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Quotation
                </button>
            </div>

            {/* Search */}
            <div className="filters glass-card">
                <div className="search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search quotations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Quotations List */}
            <div className="invoices-grid">
                {filteredQuotations.length > 0 ? (
                    filteredQuotations.map((quotation) => (
                        <div key={quotation.id} className="invoice-card glass-card glass-card-hover">
                            <div className="invoice-header">
                                <span className="invoice-number">{quotation.invoiceNumber}</span>
                                <span className={`badge badge-${quotation.status === 'draft' ? 'warning' : 'primary'}`}>
                                    {quotation.status}
                                </span>
                            </div>
                            <div className="invoice-customer">
                                <strong>{quotation.customer.name}</strong>
                                {quotation.customer.email && <span>{quotation.customer.email}</span>}
                            </div>
                            <div className="invoice-items-count">
                                {quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''}
                            </div>
                            <div className="invoice-total">
                                <span className="label">Total</span>
                                <span className="amount">{formatCurrency(quotation.total)}</span>
                            </div>
                            <div className="invoice-date">{formatDate(quotation.createdAt)}</div>
                            <div className="invoice-actions">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setViewingInvoice(quotation)}
                                >
                                    View
                                </button>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleConvert(quotation.id)}
                                >
                                    Convert to Invoice
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state glass-card">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="empty-icon">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <h3>No quotations yet</h3>
                        <p>Create your first quotation to get started</p>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            New Quotation
                        </button>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewingInvoice && (
                <div className="modal-backdrop" onClick={() => setViewingInvoice(null)}>
                    <div className="modal modal-lg glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{viewingInvoice.invoiceNumber}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setViewingInvoice(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="invoice-detail">
                                <div className="detail-section">
                                    <h4>Customer</h4>
                                    <p><strong>{viewingInvoice.customer.name}</strong></p>
                                    {viewingInvoice.customer.email && <p>{viewingInvoice.customer.email}</p>}
                                    {viewingInvoice.customer.phone && <p>{viewingInvoice.customer.phone}</p>}
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
                        <div className="modal-footer">
                            <button className="btn btn-danger" onClick={() => handleDelete(viewingInvoice.id)}>
                                Delete
                            </button>
                            <button className="btn btn-success" onClick={() => { handleConvert(viewingInvoice.id); setViewingInvoice(null); }}>
                                Convert to Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
