import { useApp } from '../context/AppContext';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { DashboardStats } from '../types';
import './Dashboard.css';

// Icons
const icons = {
    revenue: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    expenses: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    profit: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    stock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
    ),
    products: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    pending: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    paid: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
};

export default function Dashboard() {
    const { state } = useApp();

    // Calculate stats
    const stats: DashboardStats = useMemo(() => {
        const paidInvoices = state.invoices.filter(
            (i) => i.type === 'invoice' && i.status === 'paid'
        );
        const pendingInvoices = state.invoices.filter(
            (i) => i.type === 'invoice' && i.status === 'pending'
        );

        const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
        const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
        const stockValue = state.products.reduce(
            (sum, p) => sum + p.price * p.quantity,
            0
        );
        const lowStockProducts = state.products.filter((p) => p.quantity < 10).length;

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            stockValue,
            totalProducts: state.products.length,
            lowStockProducts,
            pendingInvoices: pendingInvoices.length,
            paidInvoices: paidInvoices.length,
        };
    }, [state]);

    // Sales trend data (last 7 days)
    const salesTrendData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const dayName = days[date.getDay()];

            const dayInvoices = state.invoices.filter((inv) => {
                const invDate = new Date(inv.createdAt);
                return (
                    invDate.toDateString() === date.toDateString() &&
                    inv.type === 'invoice' &&
                    inv.status === 'paid'
                );
            });

            const sales = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);

            return { day: dayName, sales };
        });
    }, [state.invoices]);

    // Top products
    const topProducts = useMemo(() => {
        const productSales: Record<string, { name: string; sales: number }> = {};

        state.invoices
            .filter((i) => i.type === 'invoice' && i.status === 'paid')
            .forEach((invoice) => {
                invoice.items.forEach((item) => {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = { name: item.productName, sales: 0 };
                    }
                    productSales[item.productId].sales += item.total;
                });
            });

        return Object.values(productSales)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [state.invoices]);

    // Recent activities
    const recentActivities = useMemo(() => {
        const activities: Array<{
            id: string;
            type: string;
            description: string;
            time: string;
            icon: 'revenue' | 'expenses' | 'products';
        }> = [];

        // Add recent invoices
        state.invoices
            .slice(-5)
            .reverse()
            .forEach((inv) => {
                activities.push({
                    id: inv.id,
                    type: inv.type === 'invoice' ? 'Invoice' : 'Quotation',
                    description: `${inv.invoiceNumber} - ${inv.customer.name}`,
                    time: new Date(inv.createdAt).toLocaleDateString(),
                    icon: 'revenue',
                });
            });

        // Add recent expenses
        state.expenses
            .slice(-3)
            .reverse()
            .forEach((exp) => {
                activities.push({
                    id: exp.id,
                    type: 'Expense',
                    description: `${exp.categoryName} - EGP ${exp.amount.toFixed(2)}`,
                    time: new Date(exp.createdAt).toLocaleDateString(),
                    icon: 'expenses',
                });
            });

        return activities.slice(0, 8);
    }, [state.invoices, state.expenses]);

    const formatCurrency = (value: number) => `EGP ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's your business overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon revenue">{icons.revenue}</div>
                    <div className="stat-content">
                        <span className="stat-label">Total Revenue</span>
                        <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon expenses">{icons.expenses}</div>
                    <div className="stat-content">
                        <span className="stat-label">Total Expenses</span>
                        <span className="stat-value">{formatCurrency(stats.totalExpenses)}</span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon profit">{icons.profit}</div>
                    <div className="stat-content">
                        <span className="stat-label">Net Profit</span>
                        <span className={`stat-value ${stats.netProfit >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(stats.netProfit)}
                        </span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon stock">{icons.stock}</div>
                    <div className="stat-content">
                        <span className="stat-label">Stock Value</span>
                        <span className="stat-value">{formatCurrency(stats.stockValue)}</span>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="secondary-stats">
                <div className="mini-stat glass-card">
                    <span className="mini-stat-icon">{icons.products}</span>
                    <div>
                        <span className="mini-stat-value">{stats.totalProducts}</span>
                        <span className="mini-stat-label">Products</span>
                    </div>
                </div>
                <div className="mini-stat glass-card warning">
                    <span className="mini-stat-icon">{icons.warning}</span>
                    <div>
                        <span className="mini-stat-value">{stats.lowStockProducts}</span>
                        <span className="mini-stat-label">Low Stock</span>
                    </div>
                </div>
                <div className="mini-stat glass-card">
                    <span className="mini-stat-icon">{icons.pending}</span>
                    <div>
                        <span className="mini-stat-value">{stats.pendingInvoices}</span>
                        <span className="mini-stat-label">Pending</span>
                    </div>
                </div>
                <div className="mini-stat glass-card success">
                    <span className="mini-stat-icon">{icons.paid}</span>
                    <div>
                        <span className="mini-stat-value">{stats.paidInvoices}</span>
                        <span className="mini-stat-label">Paid</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Sales Trend (Last 7 Days)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={salesTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(30, 41, 59, 0.95)',
                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                        borderRadius: '8px',
                                        color: '#f1f5f9',
                                    }}
                                    formatter={(value) => value !== undefined ? [`EGP ${Number(value).toFixed(2)}`, 'Sales'] : ['EGP 0.00', 'Sales']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ fill: '#6366f1', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#818cf8' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-card">
                    <h3 className="chart-title">Top Selling Products</h3>
                    <div className="chart-container">
                        {topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#64748b"
                                        fontSize={12}
                                        width={100}
                                        tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(30, 41, 59, 0.95)',
                                            border: '1px solid rgba(148, 163, 184, 0.2)',
                                            borderRadius: '8px',
                                            color: '#f1f5f9',
                                        }}
                                        formatter={(value) => value !== undefined ? [`EGP ${Number(value).toFixed(2)}`, 'Sales'] : ['EGP 0.00', 'Sales']}
                                    />
                                    <Bar dataKey="sales" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">
                                <p>No sales data yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section glass-card">
                <h3 className="section-title">Recent Activity</h3>
                {recentActivities.length > 0 ? (
                    <div className="activity-list">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="activity-item">
                                <div className={`activity-icon ${activity.icon}`}>
                                    {icons[activity.icon]}
                                </div>
                                <div className="activity-content">
                                    <span className="activity-type">{activity.type}</span>
                                    <span className="activity-desc">{activity.description}</span>
                                </div>
                                <span className="activity-time">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-activity">
                        <p>No recent activity. Start by adding products and creating invoices!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
