import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/api";
import AdminUserManagement from "../admin/AdminUserManagement";
import {
  Users,
  UserPlus,
  Building2,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  BarChart3,
  PieChart,
  Settings,
  ArrowLeft
} from "lucide-react";

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  userCount: number;
  managerCount: number;
  totalSales: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  subscriptionEnd: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  adminId: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isViewUsersOpen, setIsViewUsersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'admins' | 'users' | 'settings' | 'user-management'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalUsers: 0,
    totalSales: 0,
    activeAdmins: 0
  });
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    plan: "basic",
    branchId: "",
    password: ""
  });
  const [branches, setBranches] = useState<Array<{id: string, name: string}>>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadBranches();
  }, []);

  // Debug branches state
  useEffect(() => {
    console.log('Branches state updated:', branches);
  }, [branches]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [adminsResponse, statsResponse] = await Promise.all([
        apiService.getAdmins({ page: 1, limit: 100 }),
        apiService.getSuperAdminStats()
      ]);

      if (adminsResponse.success && adminsResponse.data) {
        console.log('Admins data received:', adminsResponse.data.admins);
        setAdmins(adminsResponse.data.admins);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await apiService.getBranches();
      console.log('Branches response:', response);
      if (response.success && response.data) {
        // Check if data is an array or has a branches property
        const branchesData = Array.isArray(response.data) ? response.data : response.data.branches;
        setBranches(branchesData.map((branch: any) => ({
          id: branch.id,
          name: branch.name
        })));
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadAdminUsers = async (adminId: string) => {
    try {
      const response = await apiService.getAdminUsers(adminId);
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAdmins = stats.totalAdmins;
  const totalUsers = stats.totalUsers;
  const totalSales = stats.totalSales;
  const activeAdmins = stats.activeAdmins;

  const createAdmin = async () => {
    console.log('Creating admin with data:', newAdmin);
    console.log('Available branches:', branches);
    
    if (!newAdmin.name || !newAdmin.email || !newAdmin.phone || !newAdmin.company || !newAdmin.branchId || !newAdmin.password) {
      alert("Please fill in all required fields! Missing: " + 
        (!newAdmin.name ? 'Name, ' : '') +
        (!newAdmin.email ? 'Email, ' : '') +
        (!newAdmin.phone ? 'Phone, ' : '') +
        (!newAdmin.company ? 'Company, ' : '') +
        (!newAdmin.branchId ? 'Branch, ' : '') +
        (!newAdmin.password ? 'Password' : '')
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createAdmin({
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        company: newAdmin.company,
        plan: newAdmin.plan as 'basic' | 'premium' | 'enterprise',
        branchId: newAdmin.branchId,
        password: newAdmin.password
      });

      if (response.success) {
        const selectedBranch = branches.find(b => b.id === newAdmin.branchId);
        alert(`Admin created successfully!\n\nAdmin Credentials:\nUsername: ${newAdmin.email.split('@')[0]}_admin\nPassword: ${newAdmin.password}\nBranch: ${selectedBranch?.name || 'Unknown'}\n\nPlease share these credentials with the admin.`);
        loadData(); // Reload data
        setNewAdmin({
          name: "",
          email: "",
          phone: "",
          company: "",
          plan: "basic",
          branchId: "",
          password: ""
        });
        setIsCreateAdminOpen(false);
      } else {
        alert(response.message || "Failed to create admin");
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert("Failed to create admin. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'admins', label: 'Admin Management', icon: Users },
    { id: 'users', label: 'User Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-border shadow-sm">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">SuperAdmin</h1>
              <p className="text-xs text-muted-foreground">MediBill Pulse</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setViewMode(item.id as any);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  (activeTab === item.id && viewMode !== 'user-management')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {viewMode === 'overview' && 'Dashboard Overview'}
                {viewMode === 'admins' && 'Admin Management'}
                {viewMode === 'users' && 'User Analytics'}
                {viewMode === 'settings' && 'Settings'}
                {viewMode === 'user-management' && 'User Management'}
              </h2>
              <p className="text-muted-foreground">
                {viewMode === 'overview' && 'Monitor your platform performance and key metrics'}
                {viewMode === 'admins' && 'Manage all admins and their subscriptions'}
                {viewMode === 'users' && 'Analyze user activity and engagement'}
                {viewMode === 'settings' && 'Configure platform settings and preferences'}
                {viewMode === 'user-management' && `Managing users for ${selectedAdmin?.name || 'Admin'}`}
              </p>
            </div>
            {viewMode === 'admins' && (
              <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] text-white hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <UserPlus className="w-5 h-5 text-primary" />
                      <span>Create New Admin</span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Row 1: Name and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Admin Name *</Label>
                        <Input
                          id="adminName"
                          placeholder="Enter admin name"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email Address *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="Enter email address"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Row 2: Phone and Company */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminPhone">Phone Number *</Label>
                        <Input
                          id="adminPhone"
                          placeholder="Enter phone number"
                          value={newAdmin.phone}
                          onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminCompany">Company Name *</Label>
                        <Input
                          id="adminCompany"
                          placeholder="Enter company name"
                          value={newAdmin.company}
                          onChange={(e) => setNewAdmin({ ...newAdmin, company: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Row 3: Password (Full Width) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="adminPassword">Password *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const generatedPassword = Math.random().toString(36).slice(-8);
                            setNewAdmin({ ...newAdmin, password: generatedPassword });
                          }}
                        >
                          Generate Password
                        </Button>
                      </div>
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder="Enter password for admin (min 6 characters)"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      />
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          This password will be used by the admin to login. You can share this with the admin.
                        </p>
                        {newAdmin.password && (
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${newAdmin.password.length >= 6 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs ${newAdmin.password.length >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                              {newAdmin.password.length >= 6 ? 'Password is strong' : 'Password must be at least 6 characters'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Branch and Plan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminBranch">Branch *</Label>
                        <Select value={newAdmin.branchId} onValueChange={(value) => {
                          console.log('Selected branch:', value);
                          const selectedBranch = branches.find(b => b.id === value);
                          console.log('Selected branch name:', selectedBranch?.name);
                          setNewAdmin({ ...newAdmin, branchId: value });
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder={branches.length > 0 ? "Select a branch" : "Loading branches..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.length > 0 ? (
                              branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No branches available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {branches.length === 0 && (
                          <div className="text-sm text-red-500">
                            <p>No branches available. Please check if branches exist in the database.</p>
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm" 
                              onClick={loadBranches}
                              className="mt-2"
                            >
                              Retry Loading Branches
                            </Button>
                          </div>
                        )}
                        {newAdmin.branchId && (
                          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                            <p>Selected Branch: <strong>{branches.find(b => b.id === newAdmin.branchId)?.name}</strong></p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPlan">Subscription Plan</Label>
                        <Select value={newAdmin.plan} onValueChange={(value) => setNewAdmin({ ...newAdmin, plan: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic Plan</SelectItem>
                            <SelectItem value="premium">Premium Plan</SelectItem>
                            <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button variant="outline" onClick={() => setIsCreateAdminOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={createAdmin}
                      disabled={isLoading}
                      className="bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] text-white hover:opacity-90"
                    >
                      {isLoading ? 'Creating...' : 'Create Admin'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Overview Tab */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadData}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              )}
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Admins</p>
                        <p className="text-2xl font-bold text-foreground">{totalAdmins}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold text-foreground">PKR {totalSales.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Admins</p>
                        <p className="text-2xl font-bold text-foreground">{activeAdmins}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Admins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span>Recent Admins</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {admins.slice(0, 3).map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-sm text-muted-foreground">{admin.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{admin.userCount} users</p>
                          <p className="text-xs text-muted-foreground">PKR {admin.totalSales.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Management Tab */}
          {viewMode === 'admins' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search admins by name, company, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Admins Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdmins.map((admin) => (
                  <Card key={admin.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{admin.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{admin.company}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setSelectedAdmin(admin);
                              await loadAdminUsers(admin.id);
                              setIsViewUsersOpen(true);
                            }}
                            title="View Users"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setViewMode('user-management');
                            }}
                            title="Manage Users"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Admin">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{admin.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{admin.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Last active: {admin.lastActive}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{admin.userCount}</p>
                          <p className="text-xs text-muted-foreground">Users</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{admin.managerCount}</p>
                          <p className="text-xs text-muted-foreground">Managers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">PKR {admin.totalSales.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Sales</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(admin.status)}`}>
                          {admin.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getPlanColor(admin.plan)}`}>
                          {admin.plan.toUpperCase()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* User Analytics Tab */}
          {viewMode === 'users' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    <span>User Distribution by Admin</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {admins.map((admin) => {
                      const adminUsers = users.filter(user => user.adminId === admin.id);
                      const percentage = totalUsers > 0 ? (adminUsers.length / totalUsers) * 100 : 0;
                      
                      return (
                        <div key={admin.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{admin.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {adminUsers.length} users ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {viewMode === 'settings' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <span>Platform Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Platform configuration settings will be available here.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management View */}
          {viewMode === 'user-management' && selectedAdmin && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode('admins')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Admins</span>
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                  <p className="text-muted-foreground">Managing users for {selectedAdmin.name}</p>
                </div>
              </div>
              <AdminUserManagement 
                adminId={selectedAdmin.id}
                adminName={selectedAdmin.name}
                branchId={selectedAdmin.branchId || ''}
              />
            </div>
          )}
        </div>
      </div>

      {/* View Users Dialog */}
      <Dialog open={isViewUsersOpen} onOpenChange={setIsViewUsersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Users for {selectedAdmin?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAdmin && users.filter(user => user.adminId === selectedAdmin.id).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(user.status)}`}>
                    {user.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Last active: {user.lastActive}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
  