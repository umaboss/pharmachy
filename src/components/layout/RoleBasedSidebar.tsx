import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  Settings, 
  UserCheck,
  Pill,
  Receipt,
  BarChart3,
  Shield,
  Building2,
  UserCog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  resource?: string;
  action?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER'],
    resource: 'dashboard',
    action: 'read'
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    roles: ['SUPER_ADMIN', 'MANAGER', 'PHARMACIST'],
    resource: 'products',
    action: 'read'
  },
  {
    name: 'POS',
    href: '/pos',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'],
    resource: 'sales',
    action: 'create'
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['SUPER_ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER'],
    resource: 'customers',
    action: 'read'
  },
  {
    name: 'Prescriptions',
    href: '/prescriptions',
    icon: Pill,
    roles: ['PHARMACIST', 'MANAGER', 'SUPER_ADMIN'],
    resource: 'prescriptions',
    action: 'read'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER'],
    resource: 'reports',
    action: 'read'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: UserCog,
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN'],
    resource: 'users',
    action: 'manage'
  },
  {
    name: 'Employee Management',
    href: '/admin/employees',
    icon: UserCheck,
    roles: ['SUPER_ADMIN', 'MANAGER'],
    resource: 'employees',
    action: 'manage'
  },
  {
    name: 'Branch Management',
    href: '/admin/branches',
    icon: Building2,
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN'],
    resource: 'branches',
    action: 'manage'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN', 'MANAGER'],
    resource: 'settings',
    action: 'read'
  }
];

const NavItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname === item.href;

  return (
    <RoleGuard 
      roles={item.roles} 
      resource={item.resource} 
      action={item.action}
    >
      <Link
        to={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <item.icon className="w-5 h-5 mr-3" />
        {item.name}
      </Link>
    </RoleGuard>
  );
};

export const RoleBasedSidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col w-64 bg-background border-r border-border">
      <div className="flex items-center px-4 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MediBill Pulse</h1>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigationItems.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.branch}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
