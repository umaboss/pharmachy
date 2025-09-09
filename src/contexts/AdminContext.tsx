import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  userRole: 'admin' | 'manager' | 'cashier';
  loginAsAdmin: (role: 'admin' | 'manager' | 'cashier') => void;
  logout: () => void;
  currentUser: {
    name: string;
    email: string;
    branch: string;
  } | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'cashier'>('cashier');
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    branch: string;
  } | null>(null);

  const loginAsAdmin = (role: 'admin' | 'manager' | 'cashier') => {
    setIsAdmin(true);
    setUserRole(role);
    
    // Mock user data - in real app this would come from login response
    if (role === 'admin') {
      setCurrentUser({
        name: 'System Administrator',
        email: 'admin@medibill.com',
        branch: 'All Branches'
      });
    } else if (role === 'manager') {
      setCurrentUser({
        name: 'Branch Manager',
        email: 'manager@medibill.com',
        branch: 'Main Branch'
      });
    } else {
      setCurrentUser({
        name: 'Cashier User',
        email: 'cashier@medibill.com',
        branch: 'Main Branch'
      });
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setUserRole('cashier');
    setCurrentUser(null);
  };

  const value: AdminContextType = {
    isAdmin,
    userRole,
    loginAsAdmin,
    logout,
    currentUser
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
