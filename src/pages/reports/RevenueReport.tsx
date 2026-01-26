import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Reports.css';

const COLORS = ['#22c55e', '#ef4444', '#6366f1', '#f59e0b'];

export default function RevenueReport() {
    const { state } = useApp();
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    const revenueData = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        if (period === 'week') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        const paidInvoices = state.invoices.filter((i) =>
            i.type === 'invoice' && i.status === 'paid' && new Date(i.createdAt) >= startDate
        );
        const periodExpenses = state.expenses.filter((e) => new Date(e.date) >= startDate);

        const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
        const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        // Group by date
        const dailyData: Record<string, { revenue: number; expenses: number }> = {};
        let current = new Date(startDate);
        while (current <= now) {
            const key = current.toISOString().split('T')[0];
            dailyData[key] = { revenue: 0, expenses: 0 };
            current.setDate(current.getDate() + 1);
        }

        paidInvoices.forEach((inv) => {
            const key = inv.createdAt.split('T')[0];
            if (dailyData[key]) dailyData[key].revenue += inv.total;
        });

        periodExpenses.forEach((exp) => {
            const key = exp.date.split('T')[0];
            if (dailyData[key]) dailyData[key].expenses += exp.amount;
        });

        const chartData = Object.entries(dailyData).map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: data.revenue,
            expenses: data.expenses,
            profit: data.revenue - data.expenses,
        }));

        const pieData = [
            { name: 'Revenue', value: totalRevenue },
            { name: 'Expenses', value: totalExpenses },
        ];

        return { totalRevenue, totalExpenses, netProfit, chartData, pieData };
    }, [state.invoices, state.expenses, period]);

    const formatCurrency = (v: number) => `EGP ${v.toFixed(2)}`;

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Revenue Report</h1>
                    <p className="page-subtitle">Track your profit and loss</p>
                </div>
                <div className="period-selector">
                    {(['week', 'month', 'year'] as const).map((p) => (
                        <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="report-stats">
                <div className="report-stat glass-card">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-value text-success">{formatCurrency(revenueData.totalRevenue)}</span>
                </div>
                <div className="report-stat glass-card">
                    <span className="stat-label">Total Expenses</span>
                    <span className="stat-value text-error">{formatCurrency(revenueData.totalExpenses)}</span>
                </div>
                <div className="report-stat glass-card highlight">
                    <span className="stat-label">Net Profit</span>
                    <span className={`stat-value ${revenueData.netProfit >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatCurrency(revenueData.netProfit)}
                    </span>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card glass-card wide">
                    <h3>Revenue vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f1f5f9' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
                            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card glass-card">
                    <h3>Overview</h3>
                    {revenueData.totalRevenue > 0 || revenueData.totalExpenses > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={revenueData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                    {revenueData.pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => v !== undefined ? formatCurrency(Number(v)) : 'EGP 0.00'} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart"><p>No data for this period</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}
