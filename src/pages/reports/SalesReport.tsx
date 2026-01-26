import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Reports.css';

export default function SalesReport() {
    const { state } = useApp();
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const paidInvoices = useMemo(() => {
        return state.invoices.filter((i) =>
            i.type === 'invoice' &&
            i.status === 'paid' &&
            i.createdAt >= dateRange.start &&
            i.createdAt <= dateRange.end + 'T23:59:59'
        );
    }, [state.invoices, dateRange]);

    const salesByDay = useMemo(() => {
        const dailySales: Record<string, number> = {};
        let current = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        while (current <= end) {
            dailySales[current.toISOString().split('T')[0]] = 0;
            current.setDate(current.getDate() + 1);
        }

        paidInvoices.forEach((inv) => {
            const date = inv.createdAt.split('T')[0];
            if (dailySales[date] !== undefined) {
                dailySales[date] += inv.total;
            }
        });

        return Object.entries(dailySales).map(([date, sales]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales,
        }));
    }, [paidInvoices, dateRange]);

    const salesByProduct = useMemo(() => {
        const products: Record<string, { name: string; quantity: number; revenue: number }> = {};

        paidInvoices.forEach((inv) => {
            inv.items.forEach((item) => {
                if (!products[item.productId]) {
                    products[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
                }
                products[item.productId].quantity += item.quantity;
                products[item.productId].revenue += item.total;
            });
        });

        return Object.values(products).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    }, [paidInvoices]);

    const totals = useMemo(() => ({
        totalSales: paidInvoices.reduce((sum, i) => sum + i.total, 0),
        totalOrders: paidInvoices.length,
        avgOrderValue: paidInvoices.length > 0 ? paidInvoices.reduce((sum, i) => sum + i.total, 0) / paidInvoices.length : 0,
    }), [paidInvoices]);

    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sales Report</h1>
                    <p className="page-subtitle">Analyze your sales performance</p>
                </div>
            </div>

            <div className="date-filter glass-card">
                <div className="form-group">
                    <label className="form-label">From</label>
                    <input type="date" className="form-input" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">To</label>
                    <input type="date" className="form-input" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
            </div>

            <div className="report-stats">
                <div className="report-stat glass-card">
                    <span className="stat-label">Total Sales</span>
                    <span className="stat-value text-success">{formatCurrency(totals.totalSales)}</span>
                </div>
                <div className="report-stat glass-card">
                    <span className="stat-label">Orders</span>
                    <span className="stat-value">{totals.totalOrders}</span>
                </div>
                <div className="report-stat glass-card">
                    <span className="stat-label">Avg Order Value</span>
                    <span className="stat-value">{formatCurrency(totals.avgOrderValue)}</span>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card glass-card">
                    <h3>Sales Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesByDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f1f5f9' }} formatter={(value) => value !== undefined ? [`EGP ${Number(value).toFixed(2)}`, 'Sales'] : ['EGP 0.00', 'Sales']} />
                            <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card glass-card">
                    <h3>Top Products by Revenue</h3>
                    {salesByProduct.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesByProduct} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v} />
                                <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f1f5f9' }} formatter={(value) => value !== undefined ? [`EGP ${Number(value).toFixed(2)}`, 'Revenue'] : ['EGP 0.00', 'Revenue']} />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart"><p>No sales data for this period</p></div>
                    )}
                </div>
            </div>

            {salesByProduct.length > 0 && (
                <div className="glass-card table-container">
                    <h3 className="table-title">Product Sales Details</h3>
                    <table className="table">
                        <thead>
                            <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
                        </thead>
                        <tbody>
                            {salesByProduct.map((p, i) => (
                                <tr key={i}><td>{p.name}</td><td>{p.quantity}</td><td className="text-success">{formatCurrency(p.revenue)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
