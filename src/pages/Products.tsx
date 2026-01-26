import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Product } from '../types';
import './Products.css';

const emptyProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    category: '',
    sku: '',
    price: 0,
    costPrice: 0,
    quantity: 0,
    unit: 'pcs',
    description: '',
};

const categories = ['Electronics', 'Furniture', 'Clothing', 'Food', 'Office Supplies', 'Other'];

export default function Products() {
    const { state, addProduct, updateProduct, deleteProduct, importData } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState(emptyProduct);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    // Filter products
    const filteredProducts = state.products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                sku: product.sku,
                price: product.price,
                costPrice: product.costPrice,
                quantity: product.quantity,
                unit: product.unit,
                description: product.description || '',
            });
        } else {
            setEditingProduct(null);
            setFormData(emptyProduct);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData(emptyProduct);
        setImageFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value.toString());
            });
            if (imageFile) {
                submitData.append('image', imageFile);
            }
            if (editingProduct) {
                submitData.append('id', editingProduct.id);
                await updateProduct(submitData);
            } else {
                await addProduct(submitData);
                alert('Product created successfully!');
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save product:', error);
            alert('Failed to save product. Please try again.');
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        try {
            await importData('products', importFile);
            alert('Products imported successfully!');
            setIsImportModalOpen(false);
            setImportFile(null);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import products. Please check the CSV format.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteProduct(id);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product. Please try again.');
        }
    };

    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">Manage your product inventory</p>
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
                    <button id="add-product-btn" className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Product
                    </button>
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
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="form-input category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            <div className="glass-card table-container">
                {filteredProducts.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Stock</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="product-image-mini">
                                                {product.imageUrl ? (
                                                    <img src={`http://localhost:3001${product.imageUrl}`} alt={product.name} />
                                                ) : (
                                                    <div className="image-placeholder">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="product-info">
                                                <span className="product-name">{product.name}</span>
                                                {product.description && (
                                                    <span className="product-desc">{product.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td><code className="sku">{product.sku}</code></td>
                                    <td><span className="badge badge-primary">{product.category}</span></td>
                                    <td className="price">{formatCurrency(product.price)}</td>
                                    <td className="cost">{formatCurrency(product.costPrice)}</td>
                                    <td>
                                        <span className={`stock ${product.quantity < 10 ? 'low' : ''}`}>
                                            {product.quantity} {product.unit}
                                        </span>
                                    </td>
                                    <td className="value">{formatCurrency(product.price * product.quantity)}</td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleOpenModal(product)}
                                                title="Edit"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            {deleteConfirm === product.id ? (
                                                <>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setDeleteConfirm(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => setDeleteConfirm(product.id)}
                                                    title="Delete"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
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
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <h3>No products found</h3>
                        <p>Add your first product to get started</p>
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                            Add Product
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={handleCloseModal}>
                    <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={handleCloseModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Product Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SKU *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select
                                            className="form-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            <option value="">Select category</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit</label>
                                        <select
                                            className="form-input"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <option value="pcs">Pieces</option>
                                            <option value="kg">Kilograms</option>
                                            <option value="m">Meters</option>
                                            <option value="box">Boxes</option>
                                            <option value="set">Sets</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Selling Price *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost Price</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.costPrice}
                                            onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Initial Stock Quantity</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Product Image</label>
                                    <div className="image-upload-wrapper">
                                        {(imageFile || editingProduct?.imageUrl) && (
                                            <div className="image-preview">
                                                <img
                                                    src={imageFile ? URL.createObjectURL(imageFile) : `http://localhost:3001${editingProduct?.imageUrl}`}
                                                    alt="Preview"
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="form-input"
                                            accept="image/*"
                                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button id="save-product-btn" type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Update Product' : 'Add Product'}
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
                            <h2>Import Products</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsImportModalOpen(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleImport}>
                            <div className="modal-body">
                                <p className="mb-4">Select a CSV file to import products. The CSV should have headers: <code>name, sku, category, price, costPrice, quantity, description</code></p>
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
