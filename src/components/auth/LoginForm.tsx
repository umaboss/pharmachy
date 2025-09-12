import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Building2,
  Shield
} from "lucide-react";
import { apiService } from "@/services/api";

interface LoginFormProps {
  onLogin: (user: { name: string; role: string; branch: string; branchId: string }) => void;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);

  // Load branches on component mount
  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await apiService.getBranches();
      
      if (response.success && response.data) {
        // Handle the response structure - check if it has a branches property
        let branchesArray: Branch[] = [];
        if (response.data.branches && Array.isArray(response.data.branches)) {
          branchesArray = response.data.branches;
        } else if (Array.isArray(response.data)) {
          branchesArray = response.data;
        } else {
          setFallbackBranches();
          return;
        }
        
        setBranches(branchesArray);
      } else {
        setFallbackBranches();
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setFallbackBranches();
    }
  };

  const setFallbackBranches = () => {
    const fallbackBranches = [
      { id: "1", name: "Head Office", address: "123 Main Street, Lahore", phone: "+92 21 1234567", email: "head@medibill.com" },
      { id: "2", name: "Main Branch", address: "456 Central Avenue, Lahore", phone: "+92 42 2345678", email: "main@medibill.com" },
      { id: "3", name: "North Branch", address: "789 North Road, Lahore", phone: "+92 51 3456789", email: "north@medibill.com" },
      { id: "4", name: "South Branch", address: "321 South Street, Lahore", phone: "+92 21 4567890", email: "south@medibill.com" },
      { id: "5", name: "Talha Branch", address: "555 Talha Plaza, Karachi", phone: "+92 21 5555555", email: "talha@medibill.com" },
      { id: "6", name: "Gulberg Branch", address: "777 Gulberg Main, Lahore", phone: "+92 42 7777777", email: "gulberg@medibill.com" },
      { id: "7", name: "DHA Branch", address: "999 DHA Phase 5, Lahore", phone: "+92 42 9999999", email: "dha@medibill.com" }
    ];
    setBranches(fallbackBranches);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiService.login({
        username: formData.username,
        password: formData.password,
        branch: formData.branch
      });

      if (response.success && response.data) {
        const { user } = response.data;
        onLogin({
          name: user.name,
          role: user.role,
          branch: user.branch.name,
          branchId: user.branch.id
        });
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MediBill Pulse</h1>
          <p className="text-gray-600">Pharmacy Management System</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <p className="text-gray-600">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                  Branch
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => handleInputChange("branch", e.target.value)}
                    className="w-full pl-10 pr-4 h-12 border border-gray-300 rounded-md focus:border-green-500 focus:ring-green-500 bg-white"
                    required
                  >
                    <option value="">Select your branch</option>
                    {branches.length > 0 ? (
                      branches.map((branch) => (
                        <option key={branch.id} value={branch.name}>
                          {branch.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading branches...</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>


            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p><strong>SuperAdmin:</strong> superadmin / password123 / Head Office</p>
                <p><strong>Admin:</strong> admin / password123 / Main Branch</p>
                <p><strong>Manager:</strong> manager / password123 / North Branch</p>
                <p><strong>Cashier:</strong> cashier / password123 / South Branch</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 MediBill Pulse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
