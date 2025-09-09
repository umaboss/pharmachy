import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Building2, 
  Shield, 
  Stethoscope, 
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2
} from "lucide-react";
import { apiService } from "@/services/api";

interface User {
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
}

interface Branch {
  id: string;
  name: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const roles = [
    { id: "MANAGER", label: "Manager", icon: Stethoscope, description: "Branch management" },
    { id: "CASHIER", label: "Cashier", icon: Users, description: "Sales and billing" }
  ];

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    branchId: "",
    role: "",
    password: ""
  });

  // Load data on component mount
  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Get current user's branch ID from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = currentUser.branch?.id;
      const currentUserId = currentUser.id;
      const currentUserRole = currentUser.role;
      
      console.log('Current user:', currentUser);
      console.log('Branch ID:', branchId);
      console.log('User role:', currentUserRole);
      
      if (!branchId) {
        setError("Unable to determine your branch. Please contact support.");
        return;
      }

      // Try to make a direct API call to get users
      try {
        const token = localStorage.getItem('token');
        console.log('Making direct API call with token:', token ? 'Present' : 'Missing');
        
        const response = await fetch(`http://localhost:5000/api/users?branchId=${branchId}&page=1&limit=100`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Direct API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Direct API response data:', data);
          
          if (data.success && data.data && data.data.users) {
            const usersData = data.data.users.map((user: any) => ({
              id: user.id,
              username: user.username,
              name: user.name,
              email: user.email,
              role: user.role,
              branchId: user.branchId,
              branch: user.branch,
              isActive: user.isActive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }));
            
            console.log('Processed users data:', usersData);
            
            // Filter out admins and superadmins, only show managers and cashiers
            const filteredUsers = usersData.filter((user: User) => {
              console.log('Filtering user:', user.name, 'Role:', user.role);
              return user.role === 'MANAGER' || user.role === 'CASHIER';
            });
            
            console.log('Filtered users:', filteredUsers);
            setUsers(filteredUsers);
            
            if (filteredUsers.length === 0) {
              setError(`Found ${usersData.length} users but none are MANAGER or CASHIER roles. Only ${usersData.map(u => u.role).join(', ')} roles found.`);
            }
          } else {
            console.error('API response not successful:', data);
            setError(data.message || "Failed to load users");
          }
        } else {
          const errorData = await response.json();
          console.error('API call failed:', errorData);
          setError(`API Error: ${errorData.message || 'Failed to load users'}`);
        }
      } catch (apiError) {
        console.error('Direct API call failed:', apiError);
        setError("Failed to load users. Please check your connection and try again.");
      }
      
    } catch (error) {
      console.error('Error loading users:', error);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await apiService.getBranches();
      if (response.success && response.data) {
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === "all" || user.branch.name === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current user's branch ID
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = currentUser.branch?.id;
      
      if (!branchId) {
        alert("Unable to determine your branch. Please contact support.");
        return;
      }

      // Generate username from email
      const username = newUser.email.split('@')[0] + '_' + newUser.role.toLowerCase();

      console.log('Creating user with data:', {
        username,
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        branchId: branchId
      });

      const response = await apiService.createUser({
        username,
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role as 'MANAGER' | 'CASHIER',
        branchId: branchId
      });

      console.log('Create user response:', response);

      if (response.success) {
        alert(`User created successfully!\n\nUser Credentials:\nUsername: ${username}\nPassword: ${newUser.password}\n\nPlease share these credentials with the user.`);
        setNewUser({ name: "", email: "", username: "", branchId: "", role: "", password: "" });
        setIsCreateDialogOpen(false);
        
        // Add the new user to the current list immediately
        const newUserData: User = {
          id: response.data.id,
          username: username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          branchId: branchId,
          branch: {
            id: branchId,
            name: currentUser.branch?.name || 'Unknown Branch'
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUsers(prevUsers => [...prevUsers, newUserData]);
      } else {
        alert(response.message || "Failed to create user");
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert("Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    const roleData = roles.find(r => r.id === role);
    if (roleData) {
      const IconComponent = roleData.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <Users className="w-4 h-4" />;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "MANAGER": return "default";
      case "CASHIER": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage branch users and their permissions</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin'}
          >
            ← Back to Admin Dashboard
          </Button>
        
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New User
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to your pharmacy system. They will receive login credentials via email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="col-span-3"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(role.id)}
                            <span>{role.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="col-span-3"
                    placeholder="Enter temporary password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90" onClick={handleCreateUser}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setNewUser({ name: "", email: "", username: "", branchId: "", role: "CASHIER", password: "" });
              setIsCreateDialogOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Quick Create Cashier
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="shadow-soft border-0 border-l-4 border-blue-500">
        <CardContent className="p-4">
          <p className="text-blue-600 text-sm">
            Debug: Total users loaded: {users.length} | Filtered users: {filteredUsers.length}
          </p>
          <p className="text-blue-600 text-sm">
            Current user role: {JSON.parse(localStorage.getItem('user') || '{}').role || 'Unknown'}
          </p>
          <p className="text-blue-600 text-sm">
            Current branch: {JSON.parse(localStorage.getItem('user') || '{}').branch?.name || 'Unknown'}
          </p>
          <p className="text-blue-600 text-sm">
            Branch ID: {JSON.parse(localStorage.getItem('user') || '{}').branch?.id || 'Unknown'}
          </p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="shadow-soft border-0 border-l-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUsers}
              className="mt-2"
            >
              Retry Loading Users
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-soft border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
                Search Users
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="branch-filter" className="text-sm font-medium text-muted-foreground mb-2 block">
                Filter by Branch
              </Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Branch</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-muted-foreground">
                      {users.length === 0 ? "No users found in this branch" : "No users match your search criteria"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.branch.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1 w-fit">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant={user.isActive ? 'default' : 'secondary'}
                          className={user.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <div key={role.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{role.label}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {role.id === 'MANAGER' && 'Branch management, inventory, sales reports'}
                    {role.id === 'CASHIER' && 'Sales, billing, customer management'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
