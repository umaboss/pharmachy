import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider } from "./contexts/AdminContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/auth/LoginForm";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import POS from "./pages/POS";
import Login from "./pages/Login";
import InventoryPage from "./pages/Inventory";
import CustomersPage from "./pages/Customers";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import UserManagement from "./components/admin/UserManagement";
import AdminReports from "./components/admin/AdminReports";
import SuperAdmin from "./pages/SuperAdmin";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Role-based Protected Route Component
const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.role?.toLowerCase() || '')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Main App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - All authenticated users */}
        <Route path="/" element={
          <MainLayout>
            <Index />
          </MainLayout>
        } />
        <Route path="/pos" element={
          <MainLayout>
            <POS />
          </MainLayout>
        } />
        <Route path="/customers" element={
          <MainLayout>
            <CustomersPage />
          </MainLayout>
        } />
        
        {/* Manager & Admin Routes */}
        <Route path="/inventory" element={
          <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
            <MainLayout>
              <InventoryPage />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/reports" element={
          <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        
        {/* All Users - Settings */}
        <Route path="/settings" element={
          <MainLayout>
            <SettingsPage />
          </MainLayout>
        } />
        
        {/* Admin Only Routes */}
        <Route path="/admin" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <UserManagement />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminReports />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        
        {/* SuperAdmin Routes */}
        <Route path="/superadmin" element={
          <RoleProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdmin />
          </RoleProtectedRoute>
        } />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
