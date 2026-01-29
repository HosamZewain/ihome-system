const API_BASE = 'https://system.ihome-store.com:3001/api';

// Generic fetch helper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers as any,
    };

    // Only set Content-Type if not sending FormData
    if (!(options?.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Products API
export const productsApi = {
    getAll: () => fetchApi<any[]>('/products'),
    get: (id: string) => fetchApi<any>(`/products/${id}`),
    create: (data: any) => {
        if (data instanceof FormData) {
            return fetchApi<any>('/products', { method: 'POST', body: data });
        }
        return fetchApi<any>('/products', { method: 'POST', body: JSON.stringify(data) });
    },
    update: (id: string, data: any) => {
        if (data instanceof FormData) {
            return fetchApi<any>(`/products/${id}`, { method: 'PUT', body: data });
        }
        return fetchApi<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    updateStock: (id: string, quantity: number) => fetchApi<any>(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    delete: (id: string) => fetchApi<void>(`/products/${id}`, { method: 'DELETE' }),
    importData: (formData: FormData) => fetchApi<any>('/products/import', { method: 'POST', body: formData }),
};

// Customers API
export const customersApi = {
    getAll: () => fetchApi<any[]>('/customers'),
    create: (data: any) => fetchApi<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/customers/${id}`, { method: 'DELETE' }),
    importData: (formData: FormData) => fetchApi<any>('/customers/import', { method: 'POST', body: formData }),
};

// Invoices API
export const invoicesApi = {
    getAll: () => fetchApi<any[]>('/invoices'),
    get: (id: string) => fetchApi<any>(`/invoices/${id}`),
    create: (data: any) => fetchApi<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi<any>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/invoices/${id}`, { method: 'DELETE' }),
};

// Expenses API
export const expensesApi = {
    getAll: () => fetchApi<any[]>('/expenses'),
    getCategories: () => fetchApi<any[]>('/expenses/categories'),
    create: (data: any) => fetchApi<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi<any>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/expenses/${id}`, { method: 'DELETE' }),
    createCategory: (data: any) => fetchApi<any>('/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),
    deleteCategory: (id: string) => fetchApi<void>(`/expenses/categories/${id}`, { method: 'DELETE' }),
};

// Suppliers API
export const suppliersApi = {
    getAll: () => fetchApi<any[]>('/suppliers'),
    create: (data: any) => fetchApi<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/suppliers/${id}`, { method: 'DELETE' }),
};

// Purchases API
export const purchasesApi = {
    getAll: () => fetchApi<any[]>('/purchases'),
    create: (data: any) => fetchApi<any>('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/purchases/${id}`, { method: 'DELETE' }),
    importData: (formData: FormData) => fetchApi<any>('/purchases/import', { method: 'POST', body: formData }),
};

// System API
export const systemApi = {
    exportDb: () => `${API_BASE}/system/export?token=${localStorage.getItem('token')}`,
    importDb: (formData: FormData) => fetchApi<any>('/system/import', { method: 'POST', body: formData }),
};

// Health check
export const healthApi = {
    check: () => fetchApi<{ status: string; timestamp: string }>('/health'),
};

