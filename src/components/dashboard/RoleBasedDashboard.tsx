import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Pill,
  Receipt,
  BarChart3,
  UserCog,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';

interface DashboardCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  roles: string[];
  resource?: string;
  action?: string;
  color: string;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Total Products',
    value: '1,234',
    icon: Package,
    description: 'Active products in inventory',
    roles: ['SUPER_ADMIN', 'MANAGER', 'PHARMACIST'],
    resource: 'products',
    action: 'read',
    color: 'text-blue-600'
  },
  {
    title: 'Today\'s Sales',
    value: '$12,345',
    icon: ShoppingCart,
    description: 'Revenue from today\'s transactions',
    roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'],
    resource: 'sales',
    action: 'read',
    color: 'text-green-600'
  },
  {
    title: 'Active Customers',
    value: '856',
    icon: Users,
    description: 'Registered customers',
    roles: ['SUPER_ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER'],
    resource: 'customers',
    action: 'read',
    color: 'text-purple-600'
  },
  {
    title: 'Low Stock Items',
    value: '23',
    icon: AlertTriangle,
    description: 'Products below minimum stock',
    roles: ['SUPER_ADMIN', 'MANAGER', 'PHARMACIST'],
    resource: 'products',
    action: 'read',
    color: 'text-orange-600'
  },
  {
    title: 'Pending Prescriptions',
    value: '12',
    icon: Pill,
    description: 'Prescriptions awaiting approval',
    roles: ['PHARMACIST', 'MANAGER', 'SUPER_ADMIN'],
    resource: 'prescriptions',
    action: 'read',
    color: 'text-red-600'
  },
  {
    title: 'Monthly Revenue',
    value: '$45,678',
    icon: DollarSign,
    description: 'Total revenue this month',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    resource: 'reports',
    action: 'read',
    color: 'text-emerald-600'
  },
  {
    title: 'Active Branches',
    value: '5',
    icon: Building2,
    description: 'Total pharmacy branches',
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN'],
    resource: 'branches',
    action: 'read',
    color: 'text-indigo-600'
  },
  {
    title: 'System Users',
    value: '42',
    icon: UserCog,
    description: 'Total system users',
    roles: ['PRODUCT_OWNER', 'SUPER_ADMIN'],
    resource: 'users',
    action: 'read',
    color: 'text-gray-600'
  }
];

const DashboardCard: React.FC<{ card: DashboardCard }> = ({ card }) => {
  return (
    <RoleGuard 
      roles={card.roles} 
      resource={card.resource} 
      action={card.action}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {card.title}
          </CardTitle>
          <card.icon className={`h-4 w-4 ${card.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{card.value}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {card.description}
          </p>
        </CardContent>
      </Card>
    </RoleGuard>
  );
};

const QuickActions: React.FC = () => {
  const { user } = useAuth();

  const getQuickActions = () => {
    switch (user?.role) {
      case 'PRODUCT_OWNER':
        return [
          { name: 'Manage Branches', href: '/admin/branches', icon: Building2 },
          { name: 'System Settings', href: '/settings', icon: BarChart3 },
          { name: 'User Management', href: '/admin/users', icon: UserCog }
        ];
      case 'SUPER_ADMIN':
        return [
          { name: 'Add Product', href: '/inventory', icon: Package },
          { name: 'View Reports', href: '/reports', icon: BarChart3 },
          { name: 'Manage Users', href: '/admin/users', icon: UserCog },
          { name: 'System Settings', href: '/settings', icon: BarChart3 }
        ];
      case 'MANAGER':
        return [
          { name: 'Add Product', href: '/inventory', icon: Package },
          { name: 'View Reports', href: '/reports', icon: BarChart3 },
          { name: 'Manage Employees', href: '/admin/employees', icon: UserCog }
        ];
      case 'PHARMACIST':
        return [
          { name: 'View Prescriptions', href: '/prescriptions', icon: Pill },
          { name: 'Check Inventory', href: '/inventory', icon: Package },
          { name: 'Customer History', href: '/customers', icon: Users }
        ];
      case 'CASHIER':
        return [
          { name: 'New Sale', href: '/pos', icon: ShoppingCart },
          { name: 'View Customers', href: '/customers', icon: Users },
          { name: 'Process Refund', href: '/pos', icon: Receipt }
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{action.name}</span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your pharmacy today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card) => (
          <DashboardCard key={card.title} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New sale completed</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Product added to inventory</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low stock alert triggered</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
