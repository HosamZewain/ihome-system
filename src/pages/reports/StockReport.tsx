import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import './Reports.css';

export default function StockReport() {
    const { state } = useApp();

    const stockData = useMemo(() => {
        const sorted = [...state.products].sort((a, b) => a.quantity - b.quantity);
        const lowStock = sorted.filter((p) => p.quantity < 10);
        const totalValue = state.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
        const totalCostValue = state.products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

        return { sorted, lowStock, totalValue, totalCostValue, potentialProfit: totalValue - totalCostValue };
    }, [state.products]);

    const formatCurrency = (v: number) => `EGP ${v.toFixed(2)}`;

    return (
        <div className="report-page">
            <div className="page-header">
                <h1 className="page-title">Stock Report</h1>
                <p className="page-subtitle">Monitor your inventory levels</p>
            </div>

            <div className="report-stats">
                <div className="report-stat glass-card">
                    <span className="stat-label">Total Products</span>
                    <span className="stat-value">{state.products.length}</span>
                </div>
                <div className="report-stat glass-card">
                    <span className="stat-label">Stock Value (Sell)</span>
                    <span className="stat-value text-success">{formatCurrency(stockData.totalValue)}</span>
                </div>
                <div className="report-stat glass-card">
                    <span className="stat-label">Stock Value (Cost)</span>
                    <span className="stat-value">{formatCurrency(stockData.totalCostValue)}</span>
                </div>
                <div className="report-stat glass-card">
                    <span className="stat-label">Potential Profit</span>
                    <span className="stat-value text-primary">{formatCurrency(stockData.potentialProfit)}</span>
                </div>
            </div>

            {stockData.lowStock.length > 0 && (
                <div className="alert-card glass-card warning">
                    <h3>⚠️ Low Stock Alert</h3>
                    <p>{stockData.lowStock.length} product(s) have low stock (less than 10 units)</p>
                    <div className="low-stock-list">
                        {stockData.lowStock.map((p) => (
                            <div key={p.id} className="low-stock-item">
                                <span>{p.name}</span>
                                <span className="qty">{p.quantity} {p.unit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card table-container">
                <h3 className="table-title">Inventory Details</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Unit Price</th>
                            <th>Cost Price</th>
                            <th>Stock Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockData.sorted.map((p) => (
                            <tr key={p.id}>
                                <td><strong>{p.name}</strong></td>
                                <td><code>{p.sku}</code></td>
                                <td><span className="badge badge-primary">{p.category}</span></td>
                                <td>{p.quantity} {p.unit}</td>
                                <td>{formatCurrency(p.price)}</td>
                                <td>{formatCurrency(p.costPrice)}</td>
                                <td className="text-success">{formatCurrency(p.price * p.quantity)}</td>
                                <td>
                                    {p.quantity === 0 ? (
                                        <span className="badge badge-error">Out of Stock</span>
                                    ) : p.quantity < 10 ? (
                                        <span className="badge badge-warning">Low Stock</span>
                                    ) : (
                                        <span className="badge badge-success">In Stock</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {state.products.length === 0 && (
                    <div className="empty-state">
                        <p>No products in inventory</p>
                    </div>
                )}
            </div>
        </div>
    );
}
