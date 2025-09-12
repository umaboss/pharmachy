


const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
    
    // Listen for storage changes to update token when user logs in from another tab
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        this.token = e.newValue;
      }
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Refresh token from localStorage in case it was updated
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('API Request:', { url, options, token: this.token ? 'Present' : 'Missing' });
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('API Response status:', response.status);
      
      const data = await response.json();
      console.log('API Response data:', data);

      if (!response.ok) {
        console.error('API Error response:', data);
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: { username: string; password: string; branch: string }) {
    const response = await this.request<{
      user: {
        id: string;
        username: string;
        name: string;
        role: string;
        branch: {
          id: string;
          name: string;
        };
      };
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async getProfile() {
    return this.request<{
      id: string;
      username: string;
      name: string;
      role: string;
      branch: {
        id: string;
        name: string;
      };
    }>('/auth/profile');
  }

  // Branches
  async getBranches() {
    return this.request<{
      branches: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        email: string;
      }>;
    }>('/branches');
  }

  // Products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    branchId?: string;
    lowStock?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      products: Array<{
        id: string;
        name: string;
        description?: string;
        category: { id: string; name: string };
        supplier: { id: string; name: string };
        branch: { id: string; name: string };
        costPrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        maxStock?: number;
        unitType: string;
        unitsPerPack: number;
        barcode?: string;
        requiresPrescription: boolean;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(productId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      category: { id: string; name: string };
      supplier: { id: string; name: string };
      branch: { id: string; name: string };
      costPrice: number;
      sellingPrice: number;
      stock: number;
      minStock: number;
      maxStock?: number;
      unitType: string;
      unitsPerPack: number;
      barcode?: string;
      requiresPrescription: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      stockMovements: Array<{
        id: string;
        type: string;
        quantity: number;
        reason?: string;
        reference?: string;
        createdAt: string;
      }>;
    }>(`/products/${productId}`);
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    categoryId: string;
    supplierId: string;
    branchId: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStock: number;
    maxStock?: number;
    unitType: string;
    unitsPerPack: number;
    barcode?: string;
    requiresPrescription: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      category: { id: string; name: string };
      supplier: { id: string; name: string };
      branch: { id: string; name: string };
      costPrice: number;
      sellingPrice: number;
      stock: number;
      minStock: number;
      maxStock?: number;
      unitType: string;
      unitsPerPack: number;
      barcode?: string;
      requiresPrescription: boolean;
      isActive: boolean;
      createdAt: string;
    }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async bulkImportProducts(products: Array<{
    name: string;
    description?: string;
    categoryId: string;
    supplierId: string;
    branchId: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStock?: number;
    maxStock?: number;
    unitType: string;
    unitsPerPack: number;
    barcode?: string;
    requiresPrescription?: boolean;
  }>) {
    return this.request<{
      successful: Array<{
        id: string;
        name: string;
        description?: string;
        category: { id: string; name: string };
        supplier: { id: string; name: string };
        branch: { id: string; name: string };
        costPrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        maxStock?: number;
        unitType: string;
        unitsPerPack: number;
        barcode?: string;
        requiresPrescription: boolean;
        isActive: boolean;
        createdAt: string;
      }>;
      failed: Array<{
        product: any;
        error: string;
      }>;
      total: number;
      successCount: number;
      failureCount: number;
    }>('/products/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }

  async updateProduct(productId: string, productData: {
    name?: string;
    description?: string;
    categoryId?: string;
    supplierId?: string;
    costPrice?: number;
    sellingPrice?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    unitType?: string;
    unitsPerPack?: number;
    barcode?: string;
    requiresPrescription?: boolean;
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      category: { id: string; name: string };
      supplier: { id: string; name: string };
      branch: { id: string; name: string };
      costPrice: number;
      sellingPrice: number;
      stock: number;
      minStock: number;
      maxStock?: number;
      unitType: string;
      unitsPerPack: number;
      barcode?: string;
      requiresPrescription: boolean;
      isActive: boolean;
      updatedAt: string;
    }>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: string) {
    return this.request<{ message: string }>(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  async updateStock(productId: string, stockData: {
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
    quantity: number;
    reason?: string;
    reference?: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      stock: number;
      category: { id: string; name: string };
      supplier: { id: string; name: string };
      branch: { id: string; name: string };
    }>(`/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(stockData),
    });
  }

  // Customers
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: string;
    vip?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      customers: Array<{
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
        branch: { id: string; name: string };
        totalPurchases: number;
        loyaltyPoints: number;
        isVIP: boolean;
        lastVisit?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/customers');
  }

  async createCustomer(customerData: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    branchId: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
      branch: { id: string; name: string };
      totalPurchases: number;
      loyaltyPoints: number;
      isVIP: boolean;
      lastVisit?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  // Sales
  async createSale(saleData: {
    customerId?: string;
    branchId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      batchNumber?: string;
      expiryDate?: string;
    }>;
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'BANK_TRANSFER';
    discountAmount?: number;
  }) {
    return this.request<{
      id: string;
      customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
        totalPurchases: number;
        loyaltyPoints: number;
        isVIP: boolean;
        lastVisit?: string;
      };
      items: Array<{
        id: string;
        product: {
          id: string;
          name: string;
          unitType: string;
          barcode?: string;
        };
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        batchNumber?: string;
        expiryDate?: string;
      }>;
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
      paymentMethod: string;
      paymentStatus: string;
      status: string;
      createdAt: string;
      receiptNumber: string;
    }>('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async getSales(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    branchId?: string;
    customerId?: string;
    paymentMethod?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      sales: Array<{
        id: string;
        customerId?: string;
        userId: string;
        branchId: string;
        subtotal: number;
        taxAmount: number;
        discountAmount: number;
        totalAmount: number;
        paymentMethod: string;
        paymentStatus: string;
        status: string;
        createdAt: string;
        customer?: {
          id: string;
          name: string;
          phone: string;
        };
        user: {
          id: string;
          name: string;
          username: string;
        };
        branch: {
          id: string;
          name: string;
        };
        items: Array<{
          id: string;
          productId: string;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
          product: {
            id: string;
            name: string;
            unitType: string;
          };
        }>;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/sales${query ? `?${query}` : ''}`);
  }

  async getSale(id: string) {
    return this.request<{
      id: string;
      customerId?: string;
      userId: string;
      branchId: string;
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
      paymentMethod: string;
      paymentStatus: string;
      status: string;
      createdAt: string;
      customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
      };
      user: {
        id: string;
        name: string;
        username: string;
      };
      branch: {
        id: string;
        name: string;
        address: string;
      };
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        batchNumber?: string;
        expiryDate?: string;
        product: {
          id: string;
          name: string;
          unitType: string;
          barcode?: string;
        };
      }>;
      receipts: Array<{
        id: string;
        receiptNumber: string;
        printedAt?: string;
      }>;
    }>(`/sales/${id}`);
  }

  async getSaleByReceiptNumber(receiptNumber: string) {
    return this.request<{
      id: string;
      customerId?: string;
      userId: string;
      branchId: string;
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
      paymentMethod: string;
      paymentStatus: string;
      status: string;
      createdAt: string;
      customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
      };
      user: {
        id: string;
        name: string;
        username: string;
      };
      branch: {
        id: string;
        name: string;
        address: string;
      };
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        batchNumber?: string;
        expiryDate?: string;
        product: {
          id: string;
          name: string;
          unitType: string;
          barcode?: string;
        };
      }>;
      receipts: Array<{
        id: string;
        receiptNumber: string;
        printedAt?: string;
      }>;
    }>(`/sales/receipt/${receiptNumber}`);
  }

  async getAvailableReceiptNumbers() {
    return this.request<{
      receipts: Array<{
        id: string;
        receiptNumber: string;
        saleId: string;
        printedAt: string;
      }>;
    }>('/sales/receipts');
  }

  // Customer Purchase History
  async getCustomerPurchaseHistory(customerId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      customer: {
        id: string;
        name: string;
        phone: string;
      };
      sales: Array<{
        id: string;
        totalAmount: number;
        subtotal: number;
        taxAmount: number;
        paymentMethod: string;
        createdAt: string;
        items: Array<{
          id: string;
          product: {
            id: string;
            name: string;
            unitType: string;
          };
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }>;
        user: {
          name: string;
          username: string;
        };
        branch: {
          name: string;
        };
      }>;
      stats: {
        totalPurchases: number;
        totalSpent: number;
        averageOrder: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/customers/${customerId}/purchase-history${query ? `?${query}` : ''}`);
  }

  // Reports
  async getSalesReport(params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    groupBy?: 'day' | 'month';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      summary: {
        totalSales: number;
        totalRevenue: number;
        totalSubtotal: number;
        totalTax: number;
        totalDiscount: number;
      };
      salesByPaymentMethod: Array<{
        paymentMethod: string;
        _sum: { totalAmount: number };
        _count: { id: number };
      }>;
      topProducts: Array<{
        productId: string;
        _sum: { quantity: number; totalPrice: number };
        product: {
          id: string;
          name: string;
          unitType: string;
          category: { name: string };
        };
      }>;
      salesTrend: Array<{
        createdAt: Date;
        _sum: { totalAmount: number };
        _count: { id: number };
      }>;
    }>(`/reports/sales${query ? `?${query}` : ''}`);
  }

  async getInventoryReport(params?: {
    branchId?: string;
    lowStock?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      summary: {
        totalProducts: number;
        totalStock: number;
        lowStockCount: number;
      };
      productsByCategory: Array<{
        categoryId: string;
        _sum: { stock: number };
        _count: { id: number };
        category: {
          id: string;
          name: string;
        };
      }>;
      lowStockProducts: Array<{
        id: string;
        name: string;
        stock: number;
        minStock: number;
        category: { name: string };
        supplier: { name: string };
      }>;
    }>(`/reports/inventory${query ? `?${query}` : ''}`);
  }

  async getCustomerReport(params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    vip?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      summary: {
        totalCustomers: number;
        totalSpent: number;
        totalLoyaltyPoints: number;
        averageSpent: number;
      };
      customersByVIP: Array<{
        isVIP: boolean;
        _count: { id: number };
        _sum: { totalPurchases: number; loyaltyPoints: number };
      }>;
      topCustomers: Array<{
        id: string;
        name: string;
        phone: string;
        totalPurchases: number;
        loyaltyPoints: number;
        lastVisit: string;
        isVIP: boolean;
        _count: { sales: number };
      }>;
      recentCustomers: Array<{
        id: string;
        name: string;
        phone: string;
        createdAt: string;
        totalPurchases: number;
      }>;
    }>(`/reports/customers${query ? `?${query}` : ''}`);
  }

  async getProductPerformanceReport(params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    categoryId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      topProducts: Array<{
        productId: string;
        _sum: { quantity: number; totalPrice: number };
        _count: { id: number };
        product: {
          id: string;
          name: string;
          unitType: string;
          sellingPrice: number;
          stock: number;
          category: { name: string };
          supplier: { name: string };
        };
      }>;
      categoryPerformance: Array<{
        category: string;
        quantity: number;
        revenue: number;
        count: number;
      }>;
    }>(`/reports/products${query ? `?${query}` : ''}`);
  }

  // Admin Management (SuperAdmin only)
  async getAdmins(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      admins: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        company: string;
        address: string;
        userCount: number;
        managerCount: number;
        totalSales: number;
        lastActive: string;
        status: 'active' | 'inactive';
        plan: 'basic' | 'premium' | 'enterprise';
        createdAt: string;
        subscriptionEnd: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/admin${query ? `?${query}` : ''}`);
  }

  async getAdmin(adminId: string) {
    return this.request<{
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
      address: string;
      userCount: number;
      managerCount: number;
      totalSales: number;
      lastActive: string;
      status: 'active' | 'inactive';
      plan: 'basic' | 'premium' | 'enterprise';
      createdAt: string;
      subscriptionEnd: string;
    }>(`/admin/${adminId}`);
  }

  async createAdmin(adminData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    plan: 'basic' | 'premium' | 'enterprise';
    branchId: string;
    password: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
      address: string;
      userCount: number;
      managerCount: number;
      totalSales: number;
      lastActive: string;
      status: 'active' | 'inactive';
      plan: 'basic' | 'premium' | 'enterprise';
      createdAt: string;
      subscriptionEnd: string;
    }>('/admin', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  async updateAdmin(adminId: string, adminData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    plan?: 'basic' | 'premium' | 'enterprise';
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
      address: string;
      userCount: number;
      managerCount: number;
      totalSales: number;
      lastActive: string;
      status: 'active' | 'inactive';
      plan: 'basic' | 'premium' | 'enterprise';
      createdAt: string;
      subscriptionEnd: string;
    }>(`/admin/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(adminData),
    });
  }

  async deleteAdmin(adminId: string) {
    return this.request<{ message: string }>(`/admin/${adminId}`, {
      method: 'DELETE',
    });
  }

  async getAdminUsers(adminId: string) {
    return this.request<Array<{
      id: string;
      name: string;
      email: string;
      adminId: string;
      lastActive: string;
      status: 'active' | 'inactive';
      role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER';
      createdAt: string;
    }>>(`/admin/${adminId}/users`);
  }

  async getSuperAdminStats() {
    return this.request<{
      totalAdmins: number;
      totalUsers: number;
      totalSales: number;
      activeAdmins: number;
      recentAdmins: Array<{
        id: string;
        name: string;
        company: string;
        userCount: number;
        totalSales: number;
      }>;
    }>('/admin/stats');
  }

  // User Management Methods
  async getUsers(params?: { page?: number; limit?: number; role?: string; branchId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.branchId) queryParams.append('branchId', params.branchId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    return this.request<{
      users: Array<{
        id: string;
        username: string;
        name: string;
        email: string;
        role: string;
        branchId: string;
        branch: {
          id: string;
          name: string;
        };
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  }

  async getUser(userId: string) {
    return this.request<{
      id: string;
      username: string;
      name: string;
      email: string;
      role: string;
      branchId: string;
      branch: {
        id: string;
        name: string;
      };
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>(`/users/${userId}`);
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER';
    branchId: string;
  }) {
    return this.request<{
      id: string;
      username: string;
      name: string;
      email: string;
      role: string;
      branchId: string;
      branch: {
        id: string;
        name: string;
      };
      isActive: boolean;
      createdAt: string;
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: {
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    role?: 'MANAGER' | 'CASHIER';
    branchId?: string;
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      username: string;
      name: string;
      email: string;
      role: string;
      branchId: string;
      branch: {
        id: string;
        name: string;
      };
      isActive: boolean;
      updatedAt: string;
    }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string) {
    return this.request<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      categories: Array<{
        id: string;
        name: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
        _count: {
          products: number;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/categories${query ? `?${query}` : ''}`);
  }

  async getCategory(categoryId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
      _count: {
        products: number;
      };
    }>(`/categories/${categoryId}`);
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      createdAt: string;
    }>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(categoryId: string, categoryData: {
    name?: string;
    description?: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      updatedAt: string;
    }>(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId: string) {
    return this.request<{ message: string }>(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Suppliers
  async getSuppliers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<{
      suppliers: Array<{
        id: string;
        name: string;
        contactPerson: string;
        phone: string;
        email: string;
        address: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        _count: {
          products: number;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/suppliers${query ? `?${query}` : ''}`);
  }

  async getSupplier(supplierId: string) {
    return this.request<{
      id: string;
      name: string;
      contactPerson: string;
      phone: string;
      email: string;
      address: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      _count: {
        products: number;
      };
    }>(`/suppliers/${supplierId}`);
  }

  async createSupplier(supplierData: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      contactPerson: string;
      phone: string;
      email: string;
      address: string;
      isActive: boolean;
      createdAt: string;
    }>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  }

  async updateSupplier(supplierId: string, supplierData: {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      contactPerson: string;
      phone: string;
      email: string;
      address: string;
      isActive: boolean;
      updatedAt: string;
    }>(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  }

  async deleteSupplier(supplierId: string) {
    return this.request<{ message: string }>(`/suppliers/${supplierId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getDashboardStats(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    return this.request<{
      todayStats: {
        sales: number;
        revenue: number;
        subtotal: number;
        tax: number;
      };
      totalStats: {
        sales: number;
        revenue: number;
        subtotal: number;
        tax: number;
      };
      inventory: {
        totalProducts: number;
        lowStockProducts: number;
      };
      customers: {
        total: number;
      };
      recentSales: Array<{
        id: string;
        totalAmount: number;
        createdAt: string;
        customer: {
          id: string;
          name: string;
          phone: string;
        };
        user: {
          id: string;
          name: string;
          username: string;
        };
      }>;
    }>(`/dashboard/stats?${params.toString()}`);
  }

  async getSalesChart(branchId?: string, period: string = '7d', groupBy: string = 'day') {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    params.append('period', period);
    params.append('groupBy', groupBy);
    
    return this.request<{
      period: string;
      groupBy: string;
      chartData: Array<{
        date?: string;
        week?: string;
        month?: string;
        revenue: number;
        sales: number;
      }>;
    }>(`/dashboard/chart?${params.toString()}`);
  }

  async getLowStockProducts(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    return this.request<{
      products: Array<{
        id: string;
        name: string;
        stock: number;
        minStock: number;
        unitType: string;
        expiryDate?: string;
      }>;
    }>(`/products/low-stock?${params.toString()}`);
  }

  // Admin Dashboard APIs
  async getAdminDashboardStats() {
    return this.request<{
      totalRevenue: number;
      totalSales: number;
      totalUsers: number;
      totalBranches: number;
      recentSales: Array<{
        id: string;
        totalAmount: number;
        createdAt: string;
        customer: {
          id: string;
          name: string;
          phone: string;
        };
        user: {
          id: string;
          name: string;
          username: string;
        };
        branch: {
          id: string;
          name: string;
        };
      }>;
      lowStockProducts: Array<{
        id: string;
        name: string;
        stock: number;
        minStock: number;
        unitType: string;
        expiryDate?: string;
        branch: {
          name: string;
        };
      }>;
      branchPerformance: Array<{
        id: string;
        name: string;
        users: number;
        sales: number;
        revenue: number;
      }>;
      recentUsers: Array<{
        id: string;
        name: string;
        username: string;
        branch: string;
        lastPurchase: string;
        lastPurchaseAmount: number;
      }>;
    }>('/dashboard/admin-stats');
  }

  async getTopSellingProducts(branchId?: string, limit: number = 10) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    params.append('limit', limit.toString());
    
    return this.request<Array<{
      productId: string;
      product: {
        id: string;
        name: string;
        price: number;
        unitType: string;
        category: {
          name: string;
        };
      };
      totalQuantity: number;
      totalRevenue: number;
      salesCount: number;
    }>>(`/dashboard/top-products?${params.toString()}`);
  }

  async getSalesByPaymentMethod(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    return this.request<Array<{
      paymentMethod: string;
      _sum: {
        totalAmount: number;
      };
      _count: {
        id: number;
      };
    }>>(`/dashboard/sales-by-payment?${params.toString()}`);
  }

  // Employee Management
  async getEmployees(params?: { page?: number; limit?: number; search?: string; status?: string; branchId?: string; isActive?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.branchId) queryParams.append('branchId', params.branchId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    return this.request<{
      employees: Array<{
        id: string;
        employeeId: string;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        position: string;
        department?: string;
        salary?: number;
        hireDate: string;
        status: string;
        branchId: string;
        branch: {
          id: string;
          name: string;
        };
        emergencyContactName?: string;
        emergencyContactPhone?: string;
        emergencyContactRelation?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/employees?${queryParams.toString()}`);
  }

  async getEmployee(id: string) {
    return this.request<{
      id: string;
      employeeId: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
      position: string;
      department?: string;
      salary?: number;
      hireDate: string;
      status: string;
      branchId: string;
      branch: {
        id: string;
        name: string;
      };
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      emergencyContactRelation?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>(`/employees/${id}`);
  }

  async createEmployee(employeeData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    position: string;
    department?: string;
    salary?: number;
    hireDate: string;
    status?: string;
    branchId: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
      position: string;
      department?: string;
      salary?: number;
      hireDate: string;
      status: string;
      branchId: string;
      branch: {
        id: string;
        name: string;
      };
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      emergencyContactRelation?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
  }

  async updateEmployee(id: string, employeeData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    position?: string;
    department?: string;
    salary?: number;
    hireDate?: string;
    status?: string;
    branchId?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
      position: string;
      department?: string;
      salary?: number;
      hireDate: string;
      status: string;
      branchId: string;
      branch: {
        id: string;
        name: string;
      };
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      emergencyContactRelation?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData)
    });
  }

  async deleteEmployee(id: string) {
    return this.request<{ message: string }>(`/employees/${id}`, {
      method: 'DELETE'
    });
  }

  async getEmployeeStats(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    return this.request<{
      totalEmployees: number;
      activeEmployees: number;
      inactiveEmployees: number;
      terminatedEmployees: number;
      onLeaveEmployees: number;
    }>(`/employees/stats?${params.toString()}`);
  }

  // Attendance Management
  async checkIn(attendanceData: {
    employeeId: string;
    branchId: string;
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      checkIn: string;
      checkOut?: string;
      totalHours?: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  }

  async checkOut(attendanceData: {
    attendanceId: string;
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      checkIn: string;
      checkOut: string;
      totalHours: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  }

  async getAttendance(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      attendance: Array<{
        id: string;
        employeeId: string;
        branchId: string;
        checkIn: string;
        checkOut?: string;
        totalHours?: number;
        status: string;
        notes?: string;
        employee: {
          id: string;
          name: string;
          employeeId: string;
          position: string;
        };
        branch: {
          id: string;
          name: string;
        };
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/attendance?${queryParams.toString()}`);
  }

  async getTodayAttendance(employeeId: string) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      checkIn: string;
      checkOut?: string;
      totalHours?: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>(`/attendance/today/${employeeId}`);
  }

  async getAttendanceStats(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      totalRecords: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      halfDayCount: number;
      leaveCount: number;
    }>(`/attendance/stats?${queryParams.toString()}`);
  }

  // Shift Management
  async startShift(shiftData: {
    employeeId: string;
    branchId: string;
    shiftDate: string;
    startTime: string;
    openingBalance?: number;
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      shiftDate: string;
      startTime: string;
      endTime?: string;
      openingBalance: number;
      cashIn: number;
      cashOut: number;
      expectedBalance?: number;
      actualBalance?: number;
      difference?: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>('/shifts/start', {
      method: 'POST',
      body: JSON.stringify(shiftData)
    });
  }

  async endShift(shiftData: {
    shiftId: string;
    endTime: string;
    actualBalance: number;
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      shiftDate: string;
      startTime: string;
      endTime: string;
      openingBalance: number;
      cashIn: number;
      cashOut: number;
      expectedBalance: number;
      actualBalance: number;
      difference: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>('/shifts/end', {
      method: 'POST',
      body: JSON.stringify(shiftData)
    });
  }

  async getShifts(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    branchId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      shifts: Array<{
        id: string;
        employeeId: string;
        branchId: string;
        shiftDate: string;
        startTime: string;
        endTime?: string;
        openingBalance: number;
        cashIn: number;
        cashOut: number;
        expectedBalance?: number;
        actualBalance?: number;
        difference?: number;
        status: string;
        notes?: string;
        employee: {
          id: string;
          name: string;
          employeeId: string;
          position: string;
        };
        branch: {
          id: string;
          name: string;
        };
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/shifts?${queryParams.toString()}`);
  }

  async getActiveShift(employeeId: string) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      shiftDate: string;
      startTime: string;
      endTime?: string;
      openingBalance: number;
      cashIn: number;
      cashOut: number;
      expectedBalance?: number;
      actualBalance?: number;
      difference?: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>(`/shifts/active/${employeeId}`);
  }

  async updateShift(shiftId: string, shiftData: {
    cashIn?: number;
    cashOut?: number;
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      shiftDate: string;
      startTime: string;
      endTime?: string;
      openingBalance: number;
      cashIn: number;
      cashOut: number;
      expectedBalance?: number;
      actualBalance?: number;
      difference?: number;
      status: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>(`/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(shiftData)
    });
  }

  async getShiftStats(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      totalShifts: number;
      activeShifts: number;
      completedShifts: number;
      cancelledShifts: number;
      totalCashIn: number;
      totalCashOut: number;
      totalDifference: number;
    }>(`/shifts/stats?${queryParams.toString()}`);
  }

  // Commission Management
  async calculateCommission(commissionData: {
    employeeId: string;
    branchId: string;
    period: string;
    periodType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    baseRate?: number;
    bonusRate?: number;
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      period: string;
      periodType: string;
      totalSales: number;
      totalTransactions: number;
      averageSale: number;
      baseRate: number;
      bonusRate: number;
      totalCommission: number;
      bonusAmount: number;
      totalAmount: number;
      status: string;
      paidAt?: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>('/commissions/calculate', {
      method: 'POST',
      body: JSON.stringify(commissionData)
    });
  }

  async getCommissions(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    branchId?: string;
    status?: string;
    periodType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      commissions: Array<{
        id: string;
        employeeId: string;
        branchId: string;
        period: string;
        periodType: string;
        totalSales: number;
        totalTransactions: number;
        averageSale: number;
        baseRate: number;
        bonusRate: number;
        totalCommission: number;
        bonusAmount: number;
        totalAmount: number;
        status: string;
        paidAt?: string;
        notes?: string;
        employee: {
          id: string;
          name: string;
          employeeId: string;
          position: string;
        };
        branch: {
          id: string;
          name: string;
        };
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/commissions?${queryParams.toString()}`);
  }

  async getCommission(commissionId: string) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      period: string;
      periodType: string;
      totalSales: number;
      totalTransactions: number;
      averageSale: number;
      baseRate: number;
      bonusRate: number;
      totalCommission: number;
      bonusAmount: number;
      totalAmount: number;
      status: string;
      paidAt?: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>(`/commissions/${commissionId}`);
  }

  async updateCommission(commissionId: string, commissionData: {
    status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
    notes?: string;
  }) {
    return this.request<{
      id: string;
      employeeId: string;
      branchId: string;
      period: string;
      periodType: string;
      totalSales: number;
      totalTransactions: number;
      averageSale: number;
      baseRate: number;
      bonusRate: number;
      totalCommission: number;
      bonusAmount: number;
      totalAmount: number;
      status: string;
      paidAt?: string;
      notes?: string;
      employee: {
        id: string;
        name: string;
        employeeId: string;
        position: string;
      };
      branch: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>(`/commissions/${commissionId}`, {
      method: 'PUT',
      body: JSON.stringify(commissionData)
    });
  }

  async getCommissionStats(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      totalCommissions: number;
      pendingCommissions: number;
      approvedCommissions: number;
      paidCommissions: number;
      cancelledCommissions: number;
      totalAmount: number;
      totalPaidAmount: number;
    }>(`/commissions/stats?${queryParams.toString()}`);
  }

  async getEmployeePerformance(employeeId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      sales: {
        totalSales: number;
        totalTransactions: number;
        averageSale: number;
      };
      commissions: {
        totalCommissions: number;
        totalAmount: number;
        totalCommission: number;
        totalBonus: number;
      };
      recentCommissions: Array<{
        id: string;
        period: string;
        periodType: string;
        totalAmount: number;
        status: string;
        createdAt: string;
        branch: {
          id: string;
          name: string;
        };
      }>;
    }>(`/commissions/performance/${employeeId}?${queryParams.toString()}`);
  }

  // Branch Management
  async getBranches(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    return this.request<{
      branches: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        email: string;
        managerId?: string;
        isActive: boolean;
        createdAt: string;
        _count: {
          users: number;
          products: number;
          customers: number;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/branches${query.toString() ? `?${query.toString()}` : ''}`);
  }

  async getBranch(id: string) {
    return this.request<{
      id: string;
      name: string;
      address: string;
      phone: string;
      email: string;
      managerId?: string;
      isActive: boolean;
      createdAt: string;
      _count: {
        users: number;
        products: number;
        customers: number;
      };
    }>(`/branches/${id}`);
  }

  async createBranch(branchData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    managerId?: string;
  }) {
    return this.request<{
      id: string;
      name: string;
      address: string;
      phone: string;
      email: string;
      managerId?: string;
      isActive: boolean;
      createdAt: string;
    }>('/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  }

  async updateBranch(id: string, branchData: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    managerId?: string;
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      address: string;
      phone: string;
      email: string;
      managerId?: string;
      isActive: boolean;
      createdAt: string;
    }>(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    });
  }

  async deleteBranch(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/branches/${id}`, {
      method: 'DELETE',
    });
  }

  // Logout
  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;