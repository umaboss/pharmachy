import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: 'PRODUCT_OWNER' | 'SUPER_ADMIN' | 'MANAGER' | 'PHARMACIST' | 'CASHIER';
  branch: string;
  branchId: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: string[]) => boolean;
  canAccess: (resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('medibill_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('medibill_user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('medibill_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('medibill_user');
  };

  // Role-based permission checking
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Define role-based permissions
    const rolePermissions: Record<string, Record<string, string[]>> = {
      PRODUCT_OWNER: {
        users: ['manage'],
        branches: ['manage'],
        settings: ['manage'],
        integrations: ['manage'],
        backup: ['manage'],
        analytics: ['read'],
        billing: ['manage']
      },
      SUPER_ADMIN: {
        users: ['manage'],
        employees: ['manage'],
        branches: ['manage'],
        products: ['manage'],
        categories: ['manage'],
        suppliers: ['manage'],
        sales: ['manage'],
        reports: ['manage'],
        dashboard: ['read'],
        settings: ['manage'],
        integrations: ['manage'],
        backup: ['manage'],
        commissions: ['manage'],
        customers: ['manage'],
        refunds: ['manage']
      },
      MANAGER: {
        users: ['create', 'read', 'update'],
        employees: ['manage'],
        products: ['manage'],
        categories: ['manage'],
        suppliers: ['manage'],
        sales: ['read', 'update'],
        reports: ['read', 'export'],
        dashboard: ['read'],
        refunds: ['approve', 'reject'],
        customers: ['manage'],
        commissions: ['read'],
        settings: ['read']
      },
      PHARMACIST: {
        products: ['read', 'update'],
        prescriptions: ['manage'],
        customers: ['read', 'update'],
        medication_history: ['read'],
        sales: ['read', 'update'],
        stock_movements: ['read', 'update'],
        dashboard: ['read'],
        reports: ['read'],
        categories: ['read']
      },
      CASHIER: {
        sales: ['create', 'read'],
        receipts: ['create', 'read'],
        refunds: ['create', 'read'],
        products: ['read'],
        customers: ['read', 'create', 'update'],
        categories: ['read'],
        dashboard: ['read'],
        reports: ['read']
      }
    };

    const userPermissions = rolePermissions[user.role] || {};
    const resourcePermissions = userPermissions[resource] || [];
    
    return resourcePermissions.includes(action) || resourcePermissions.includes('manage');
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccess = (resource: string): boolean => {
    if (!user) return false;
    
    const accessibleResources: Record<string, string[]> = {
      PRODUCT_OWNER: ['users', 'branches', 'settings', 'integrations', 'backup', 'analytics', 'billing'],
      SUPER_ADMIN: ['users', 'employees', 'branches', 'products', 'categories', 'suppliers', 'sales', 'reports', 'dashboard', 'settings', 'integrations', 'backup', 'commissions', 'customers', 'refunds'],
      MANAGER: ['users', 'employees', 'products', 'categories', 'suppliers', 'sales', 'reports', 'dashboard', 'refunds', 'customers', 'commissions', 'settings'],
      PHARMACIST: ['products', 'prescriptions', 'customers', 'medication_history', 'sales', 'stock_movements', 'dashboard', 'reports', 'categories'],
      CASHIER: ['sales', 'receipts', 'refunds', 'products', 'customers', 'categories', 'dashboard', 'reports']
    };

    const userAccessibleResources = accessibleResources[user.role] || [];
    return userAccessibleResources.includes(resource);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    hasPermission,
    hasRole,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
