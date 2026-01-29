import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { AppState, AppAction, Product, Invoice, Expense, Customer } from '../types';
import { productsApi, customersApi, invoicesApi, expensesApi, purchasesApi } from '../services/api';

// Initial state
const initialState: AppState = {
    products: [],
    invoices: [],
    expenses: [],
    expenseCategories: [],
    customers: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'ADD_PRODUCT':
            return { ...state, products: [...state.products, action.payload] };
        case 'UPDATE_PRODUCT':
            return {
                ...state,
                products: state.products.map((p) =>
                    p.id === action.payload.id ? action.payload : p
                ),
            };
        case 'DELETE_PRODUCT':
            return {
                ...state,
                products: state.products.filter((p) => p.id !== action.payload),
            };
        case 'UPDATE_STOCK':
            return {
                ...state,
                products: state.products.map((p) =>
                    p.id === action.payload.productId
                        ? { ...p, quantity: action.payload.quantity, updatedAt: new Date().toISOString() }
                        : p
                ),
            };
        case 'ADD_INVOICE':
            return { ...state, invoices: [...state.invoices, action.payload] };
        case 'UPDATE_INVOICE':
            return {
                ...state,
                invoices: state.invoices.map((i) =>
                    i.id === action.payload.id ? action.payload : i
                ),
            };
        case 'DELETE_INVOICE':
            return {
                ...state,
                invoices: state.invoices.filter((i) => i.id !== action.payload),
            };
        case 'CONVERT_TO_INVOICE': {
            const quotation = state.invoices.find((i) => i.id === action.payload);
            if (!quotation) return state;
            const invoice: Invoice = {
                ...quotation,
                type: 'invoice',
                status: 'pending',
                invoiceNumber: `INV-${Date.now()}`,
            };
            return {
                ...state,
                invoices: state.invoices.map((i) =>
                    i.id === action.payload ? invoice : i
                ),
            };
        }
        case 'ADD_EXPENSE':
            return { ...state, expenses: [...state.expenses, action.payload] };
        case 'UPDATE_EXPENSE':
            return {
                ...state,
                expenses: state.expenses.map((e) =>
                    e.id === action.payload.id ? action.payload : e
                ),
            };
        case 'DELETE_EXPENSE':
            return {
                ...state,
                expenses: state.expenses.filter((e) => e.id !== action.payload),
            };
        case 'ADD_EXPENSE_CATEGORY':
            return {
                ...state,
                expenseCategories: [...state.expenseCategories, action.payload],
            };
        case 'DELETE_EXPENSE_CATEGORY':
            return {
                ...state,
                expenseCategories: state.expenseCategories.filter(
                    (c) => c.id !== action.payload
                ),
            };
        case 'ADD_CUSTOMER':
            return { ...state, customers: [...state.customers, action.payload] };
        case 'UPDATE_CUSTOMER':
            return {
                ...state,
                customers: state.customers.map((c) =>
                    c.id === action.payload.id ? action.payload : c
                ),
            };
        case 'LOAD_DATA':
            return action.payload;
        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    loading: boolean;
    error: string | null;
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | FormData) => Promise<void>;
    updateProduct: (product: Product | FormData) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => Promise<void>;
    updateInvoice: (invoice: Invoice) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;
    convertToInvoice: (quotationId: string) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    addExpenseCategory: (category: { name: string; color: string }) => Promise<void>;
    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    updateCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    importData: (type: 'products' | 'customers' | 'purchases', file: File) => Promise<void>;
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load all data from API
    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [products, invoices, expenses, categories, customers] = await Promise.all([
                productsApi.getAll(),
                invoicesApi.getAll(),
                expensesApi.getAll(),
                expensesApi.getCategories(),
                customersApi.getAll(),
            ]);

            dispatch({
                type: 'LOAD_DATA',
                payload: {
                    products,
                    invoices,
                    expenses,
                    expenseCategories: categories,
                    customers,
                },
            });
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to connect to server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Product operations
    const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | FormData) => {
        try {
            const product = await productsApi.create(productData);
            dispatch({ type: 'ADD_PRODUCT', payload: product });
        } catch (err) {
            console.error('Failed to add product:', err);
            throw err;
        }
    };

    const updateProduct = async (product: Product | FormData) => {
        try {
            let updatedProduct: Product;
            if (product instanceof FormData) {
                const id = product.get('id') as string;
                updatedProduct = await productsApi.update(id, product);
            } else {
                updatedProduct = await productsApi.update(product.id, product);
            }
            dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        } catch (err) {
            console.error('Failed to update product:', err);
            throw err;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await productsApi.delete(id);
            dispatch({ type: 'DELETE_PRODUCT', payload: id });
        } catch (err) {
            console.error('Failed to delete product:', err);
            throw err;
        }
    };

    // Invoice operations
    const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => {
        try {
            const prefix = invoiceData.type === 'quotation' ? 'QT' : 'INV';
            const invoice = await invoicesApi.create({
                ...invoiceData,
                invoiceNumber: `${prefix}-${Date.now()}`,
            });
            dispatch({ type: 'ADD_INVOICE', payload: invoice });

            // Update stock for paid invoices
            if (invoiceData.type === 'invoice' && invoiceData.status === 'paid') {
                for (const item of invoiceData.items) {
                    await productsApi.updateStock(item.productId, -item.quantity);
                }
                await refreshData(); // Refresh to get updated stock
            }
        } catch (err) {
            console.error('Failed to add invoice:', err);
            throw err;
        }
    };

    const updateInvoice = async (invoice: Invoice) => {
        try {
            await invoicesApi.update(invoice.id, invoice);
            dispatch({ type: 'UPDATE_INVOICE', payload: invoice });
        } catch (err) {
            console.error('Failed to update invoice:', err);
            throw err;
        }
    };

    const deleteInvoice = async (id: string) => {
        try {
            await invoicesApi.delete(id);
            dispatch({ type: 'DELETE_INVOICE', payload: id });
        } catch (err) {
            console.error('Failed to delete invoice:', err);
            throw err;
        }
    };

    const convertToInvoice = async (quotationId: string) => {
        try {
            const quotation = state.invoices.find((i) => i.id === quotationId);
            if (!quotation) return;

            const invoice: Invoice = {
                ...quotation,
                type: 'invoice',
                status: 'pending',
                invoiceNumber: `INV-${Date.now()}`,
            };

            await invoicesApi.update(quotationId, invoice);
            dispatch({ type: 'UPDATE_INVOICE', payload: invoice });
        } catch (err) {
            console.error('Failed to convert to invoice:', err);
            throw err;
        }
    };

    // Expense operations
    const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
        try {
            const expense = await expensesApi.create(expenseData);
            dispatch({ type: 'ADD_EXPENSE', payload: expense });
            await refreshData(); // Refresh to get latest
        } catch (err) {
            console.error('Failed to add expense:', err);
            throw err;
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            await expensesApi.delete(id);
            dispatch({ type: 'DELETE_EXPENSE', payload: id });
        } catch (err) {
            console.error('Failed to delete expense:', err);
            throw err;
        }
    };

    const addExpenseCategory = async (categoryData: { name: string; color: string }) => {
        try {
            const category = await expensesApi.createCategory(categoryData);
            dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: category });
        } catch (err) {
            console.error('Failed to add expense category:', err);
            throw err;
        }
    };

    // Customer operations
    const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
        try {
            const customer = await customersApi.create(customerData);
            dispatch({ type: 'ADD_CUSTOMER', payload: customer });
        } catch (err) {
            console.error('Failed to add customer:', err);
            throw err;
        }
    };

    const updateCustomer = async (customer: Customer) => {
        try {
            await customersApi.update(customer.id, customer);
            dispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
        } catch (err) {
            console.error('Failed to update customer:', err);
            throw err;
        }
    };

    const deleteCustomer = async (id: string) => {
        try {
            await customersApi.delete(id);
            dispatch({ type: 'DELETE_CUSTOMER', payload: id });
        } catch (err) {
            console.error('Failed to delete customer:', err);
            throw err;
        }
    };

    const importData = async (type: 'products' | 'customers' | 'purchases', file: File) => {
        try {
            const formData = new FormData();
            formData.append('csv', file);

            if (type === 'products') {
                await productsApi.importData(formData);
            } else if (type === 'customers') {
                await customersApi.importData(formData);
            } else if (type === 'purchases') {
                await purchasesApi.importData(formData);
            }

            await refreshData();
        } catch (err) {
            console.error(`Failed to import ${type}:`, err);
            throw err;
        }
    };

    // Show loading or error state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                color: '#f1f5f9',
                fontSize: '1.25rem',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>⏳</div>
                    <div>Loading iHome System...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                color: '#f1f5f9',
                fontSize: '1.25rem',
            }}>
                <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>⚠️</div>
                    <div style={{ marginBottom: '1rem', color: '#ef4444' }}>{error}</div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Run <code style={{ background: '#1e293b', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>cd server && npm run dev</code> to start the backend server.
                    </div>
                    <button
                        onClick={refreshData}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AppContext.Provider
            value={{
                state,
                dispatch,
                loading,
                error,
                addProduct,
                updateProduct,
                deleteProduct,
                addInvoice,
                updateInvoice,
                deleteInvoice,
                convertToInvoice,
                addExpense,
                deleteExpense,
                addExpenseCategory,
                addCustomer,
                updateCustomer,
                deleteCustomer,
                importData,
                refreshData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
