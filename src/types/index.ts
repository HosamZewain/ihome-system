// Product
export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: 'individual' | 'company';
  companyName?: string;
  taxNumber?: string;
  details?: string;
  createdAt?: string;
  invoiceCount?: number;
  totalSpent?: number;
}

// Invoice Item
export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Item level discount
  total: number;
}

// Invoice/Quotation
export interface Invoice {
  id: string;
  type: 'quotation' | 'invoice';
  invoiceNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discount: number; // Calculated discount amount
  discountType: 'percentage' | 'fixed'; // Type of global discount
  discountValue: number; // Raw value input
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue';
  notes?: string;
  createdAt: string;
  dueDate?: string;
  paidAt?: string;
}

// Expense Category
export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

// Expense
export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

// App State
export interface AppState {
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  customers: Customer[];
}

// Action Types
export type AppAction =
  // Products
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'UPDATE_STOCK'; payload: { productId: string; quantity: number } }
  // Invoices
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'CONVERT_TO_INVOICE'; payload: string }
  // Expenses
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  // Categories
  | { type: 'ADD_EXPENSE_CATEGORY'; payload: ExpenseCategory }
  | { type: 'DELETE_EXPENSE_CATEGORY'; payload: string }
  // Customers
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  // Data
  | { type: 'LOAD_DATA'; payload: AppState };

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  stockValue: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingInvoices: number;
  paidInvoices: number;
}

// Report Filters
export interface ReportFilters {
  startDate: string;
  endDate: string;
  productId?: string;
  categoryId?: string;
}
