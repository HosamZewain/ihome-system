import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import SalesReport from './pages/reports/SalesReport';
import StockReport from './pages/reports/StockReport';
import RevenueReport from './pages/reports/RevenueReport';
import Quotations from './pages/sales/Quotations';
import Invoices from './pages/sales/Invoices';
import CreateInvoice from './pages/sales/CreateInvoice';
import CreateQuotation from './pages/sales/CreateQuotation';
import Expenses from './pages/Expenses';
import Suppliers from './pages/purchases/Suppliers';
import Purchases from './pages/purchases/Purchases';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import SystemBackup from './pages/SystemBackup';
import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="customers" element={<Customers />} />
                <Route path="admin/users" element={<Users />} />
                <Route path="admin/roles" element={<Roles />} />
                <Route path="admin/system" element={<SystemBackup />} />
                <Route path="sales/quotations" element={<Quotations />} />
                <Route path="sales/invoices/new" element={<CreateInvoice />} />
                <Route path="sales/invoices" element={<Invoices />} />
                <Route path="sales/quotations/new" element={<CreateQuotation />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="purchases/suppliers" element={<Suppliers />} />
                <Route path="purchases/invoices" element={<Purchases />} />
                <Route path="reports/sales" element={<SalesReport />} />
                <Route path="reports/stock" element={<StockReport />} />
                <Route path="reports/revenue" element={<RevenueReport />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
