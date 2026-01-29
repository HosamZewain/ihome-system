import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Products.css';

export default function Customers() {
    const { state, addCustomer, updateCustomer, deleteCustomer, importData } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        customerType: 'individual' as 'individual' | 'company',
        companyName: '',
        taxNumber: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await updateCustomer({ ...editingCustomer, ...formData });
            } else {
                await addCustomer(formData);
            }
            closeModal();
        } catch (error) {
            console.error('Failed to save customer:', error);
        }
    };
    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                await deleteCustomer(id);
            } catch (error) {
                console.error('Failed to delete customer:', error);
                alert('Failed to delete customer. Some customers cannot be deleted if they have associated invoices.');
            }
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        try {
            await importData('customers', importFile);
            alert('Customers imported successfully!');
            setIsImportModalOpen(false);
            setImportFile(null);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import customers. Please check the CSV format.');
        }
    };

    const openModal = (customer?: any) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                customerType: customer.customerType || 'individual',
                companyName: customer.companyName || '',
                taxNumber: customer.taxNumber || '',
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                customerType: 'individual',
                companyName: '',
                taxNumber: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = state.customers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer as any).companyName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || (customer as any).customerType === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p className="text-muted">Manage your customers and view their purchase history</p>
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
                    <button id="add-customer-btn" className="btn btn-primary" onClick={() => openModal()}>
                        + Add Customer
                    </button>
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <input
                        id="customer-search-input"
                        type="text"
                        className="form-input"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="form-input"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ width: '180px' }}
                >
                    <option value="all">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                </select>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Contact Info</th>
                            <th>Type</th>
                            <th>Orders</th>
                            <th className="text-right">Total Spent</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state-container">
                                        <div className="empty-state-icon">👥</div>
                                        <p>No customers found matching your search.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer: any) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="cell-name-info">
                                            <span className="name-primary">{customer.name}</span>
                                            {customer.companyName && (
                                                <span className="name-secondary">
                                                    🏢 {customer.companyName}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cell-contact-info">
                                            {customer.email && (
                                                <div className="contact-row">
                                                    <span>📧</span>
                                                    <a href={`mailto:${customer.email}`}>
                                                        {customer.email}
                                                    </a>
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="contact-row">
                                                    <span>📞</span>
                                                    <a href={`tel:${customer.phone}`}>
                                                        {customer.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${customer.customerType === 'company' ? 'company' : 'individual'
                                            }`}>
                                            {customer.customerType === 'company' ? 'Company' : 'Individual'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm text-muted">
                                            {customer.invoiceCount || 0} orders
                                        </span>
                                    </td>
                                    <td className="text-right font-medium text-success">
                                        EGP {(customer.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <div className="cell-actions">
                                            <button
                                                className="icon-btn edit-customer-btn"
                                                onClick={() => openModal(customer)}
                                                title="Edit Customer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                className="icon-btn danger delete-customer-btn"
                                                onClick={() => handleDelete(customer.id)}
                                                title="Delete Customer"
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                            <button className="btn btn-ghost" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} id="customer-form">
                            <div className="form-group">
                                <label>Customer Type *</label>
                                <select
                                    className="form-input"
                                    value={formData.customerType}
                                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'individual' | 'company' })}
                                >
                                    <option value="individual">Individual</option>
                                    <option value="company">Company</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{formData.customerType === 'company' ? 'Contact Name' : 'Full Name'} *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {formData.customerType === 'company' && (
                                <>
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tax/VAT Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.taxNumber}
                                            onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" id="save-customer-btn" className="btn btn-primary">
                                    {editingCustomer ? 'Update' : 'Add'} Customer
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
                            <h2>Import Customers</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsImportModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleImport}>
                            <div className="modal-body">
                                <p className="mb-4">Select a CSV file to import customers. Headers: <code>name, email, phone, address, customerType, companyName, taxNumber, details</code></p>
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
