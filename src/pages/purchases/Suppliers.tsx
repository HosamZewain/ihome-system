import { useState, useEffect } from 'react';
import { suppliersApi } from '../../services/api';
import '../Products.css';

interface Supplier {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
}

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            const data = await suppliersApi.getAll();
            setSuppliers(data);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await suppliersApi.update(editingSupplier.id, formData);
            } else {
                await suppliersApi.create(formData);
            }
            await loadSuppliers();
            closeModal();
        } catch (error) {
            console.error('Failed to save supplier:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                await suppliersApi.delete(id);
                await loadSuppliers();
            } catch (error) {
                console.error('Failed to delete supplier:', error);
                alert('Failed to delete supplier. Some suppliers cannot be deleted if they have associated purchase invoices.');
            }
        }
    };

    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', email: '', phone: '', address: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
        setFormData({ name: '', email: '', phone: '', address: '' });
    };

    if (loading) {
        return <div className="page-loading">Loading suppliers...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Suppliers</h1>
                    <p className="text-muted">Manage your product suppliers</p>
                </div>
                <button id="add-supplier-btn" className="btn btn-primary" onClick={() => openModal()}>
                    + Add Supplier
                </button>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Supplier</th>
                            <th>Contact Info</th>
                            <th>Address</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className="empty-state-container">
                                        <div className="empty-state-icon">📦</div>
                                        <p>No suppliers found. Add your first supplier to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>
                                        <span className="name-primary">{supplier.name}</span>
                                    </td>
                                    <td>
                                        <div className="cell-contact-info">
                                            {supplier.email && (
                                                <div className="contact-row">
                                                    <span>📧</span>
                                                    <a href={`mailto:${supplier.email}`}>
                                                        {supplier.email || '-'}
                                                    </a>
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="contact-row">
                                                    <span>📞</span>
                                                    <a href={`tel:${supplier.phone}`}>
                                                        {supplier.phone || '-'}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-muted text-sm" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {supplier.address || '-'}
                                    </td>
                                    <td>
                                        <div className="cell-actions">
                                            <button
                                                className="icon-btn"
                                                onClick={() => openModal(supplier)}
                                                title="Edit Supplier"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleDelete(supplier.id)}
                                                title="Delete Supplier"
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
                            <h2>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                            <button className="btn btn-ghost" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Supplier Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
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
                                <button id="save-supplier-btn" type="submit" className="btn btn-primary">
                                    {editingSupplier ? 'Update' : 'Add'} Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
