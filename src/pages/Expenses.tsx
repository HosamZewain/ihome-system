import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './Expenses.css';

export default function Expenses() {
    const { state, addExpense, deleteExpense, addExpenseCategory } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Expense Form
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Category Form
    const [categoryName, setCategoryName] = useState('');
    const [categoryColor, setCategoryColor] = useState('#6366f1');

    const [filterCategory, setFilterCategory] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        return state.expenses.filter((exp) => {
            const matchesCategory = !filterCategory || exp.categoryId === filterCategory;
            const matchesMonth = !filterMonth || exp.date.startsWith(filterMonth);
            return matchesCategory && matchesMonth;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [state.expenses, filterCategory, filterMonth]);

    // Monthly summary
    const monthlySummary = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        let total = 0;

        filteredExpenses.forEach((exp) => {
            categoryTotals[exp.categoryId] = (categoryTotals[exp.categoryId] || 0) + exp.amount;
            total += exp.amount;
        });

        return { categoryTotals, total };
    }, [filteredExpenses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const category = state.expenseCategories.find((c) => c.id === categoryId);
            if (!category) return;

            await addExpense({
                categoryId,
                categoryName: category.name,
                amount: parseFloat(amount),
                description,
                date,
            });

            handleCloseModal();
        } catch (error) {
            console.error('Failed to add expense:', error);
            alert('Failed to add expense. Please try again.');
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addExpenseCategory({ name: categoryName, color: categoryColor });
            setIsCategoryModalOpen(false);
            setCategoryName('');
            setCategoryColor('#6366f1');
        } catch (error) {
            console.error('Failed to add category:', error);
            alert('Failed to add category. Please try again.');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCategoryId('');
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteExpense(id);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('Failed to delete expense.');
        }
    };

    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    // Get available months from expenses
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        state.expenses.forEach((exp) => {
            months.add(exp.date.substring(0, 7));
        });
        return Array.from(months).sort().reverse();
    }, [state.expenses]);

    return (
        <div className="expenses-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expenses</h1>
                    <p className="page-subtitle">Track your business expenses</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)}>
                        Manage Categories
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="expense-summary">
                <div className="summary-card glass-card total">
                    <span className="summary-label">Total Expenses</span>
                    <span className="summary-value">{formatCurrency(monthlySummary.total)}</span>
                </div>
                {state.expenseCategories.slice(0, 4).map((cat) => (
                    <div key={cat.id} className="summary-card glass-card">
                        <div className="category-indicator" style={{ background: cat.color }} />
                        <span className="summary-label">{cat.name}</span>
                        <span className="summary-value">
                            {formatCurrency(monthlySummary.categoryTotals[cat.id] || 0)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="filters glass-card">
                <select
                    className="form-input"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {state.expenseCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <select
                    className="form-input"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                >
                    <option value="">All Time</option>
                    {availableMonths.map((month) => (
                        <option key={month} value={month}>
                            {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </option>
                    ))}
                </select>
            </div>

            {/* Expenses List */}
            <div className="glass-card table-container">
                {filteredExpenses.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense) => {
                                const category = state.expenseCategories.find((c) => c.id === expense.categoryId);
                                return (
                                    <tr key={expense.id}>
                                        <td>{formatDate(expense.date)}</td>
                                        <td>
                                            <span className="category-badge" style={{
                                                background: `${category?.color}20`,
                                                color: category?.color
                                            }}>
                                                {expense.categoryName}
                                            </span>
                                        </td>
                                        <td className="description">{expense.description}</td>
                                        <td className="amount text-error">{formatCurrency(expense.amount)}</td>
                                        <td>
                                            {deleteConfirm === expense.id ? (
                                                <div className="actions">
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(expense.id)}>
                                                        Confirm
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => setDeleteConfirm(expense.id)}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="empty-icon">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <h3>No expenses recorded</h3>
                        <p>Start tracking your business expenses</p>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            Add Expense
                        </button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={handleCloseModal}>
                    <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Expense</h2>
                            <button className="btn btn-ghost btn-icon" onClick={handleCloseModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Category *</label>
                                    <select
                                        className="form-input"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {state.expenseCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea
                                        className="form-input"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsCategoryModalOpen(false)}>
                    <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Expense Categories</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsCategoryModalOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="category-list mb-6">
                                {state.expenseCategories.map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center p-2 border-b border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ background: cat.color }} />
                                            <span>{cat.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddCategory} className="border-t border-slate-700 pt-4">
                                <h3 className="mb-4">Add New Category</h3>
                                <div className="form-group mb-4">
                                    <label className="form-label">Name</label>
                                    <input className="form-input" value={categoryName} onChange={e => setCategoryName(e.target.value)} required />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label">Color</label>
                                    <input type="color" className="form-input h-10 p-1" value={categoryColor} onChange={e => setCategoryColor(e.target.value)} />
                                </div>
                                <button type="submit" className="btn btn-primary w-full mt-4">Add Category</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
