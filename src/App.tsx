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
import EmployeeManagement from "./components/admin/EmployeeManagement";
import AdminReports from "./components/admin/AdminReports";
import RoleManagement from "./components/admin/RoleManagement";
import SuperAdmin from "./pages/SuperAdmin";
import { RoleBasedDashboard } from "./components/dashboard/RoleBasedDashboard";
import { RoleBasedSidebar } from "./components/layout/RoleBasedSidebar";
import Refunds from "./components/pos/Refunds";
import Invoices from "./components/pos/Invoices";
import EmployeeCheckIn from "./components/pos/EmployeeCheckIn";
import ShiftManagement from "./components/pos/ShiftManagement";
import PerformanceTracking from "./components/pos/PerformanceTracking";
import InventoryTransfers from "./components/inventory/InventoryTransfers";
import CommissionTracking from "./components/pos/CommissionTracking";

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
  
  if (!allowedRoles.includes(user?.role || '')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
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
            <RoleBasedDashboard />
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
        <Route path="/invoices" element={
          <MainLayout>
            <Invoices />
          </MainLayout>
        } />
        <Route path="/refunds" element={
          <MainLayout>
            <Refunds />
          </MainLayout>
        } />
        <Route path="/checkin" element={
          <MainLayout>
            <EmployeeCheckIn />
          </MainLayout>
        } />
        <Route path="/shifts" element={
          <MainLayout>
            <ShiftManagement />
          </MainLayout>
        } />
        <Route path="/performance" element={
          <MainLayout>
            <PerformanceTracking />
          </MainLayout>
        } />
        
        {/* Manager & Admin Routes */}
        <Route path="/inventory-transfers" element={
          <RoleProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN']}>
            <MainLayout>
              <InventoryTransfers />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/commission" element={
          <RoleProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN']}>
            <MainLayout>
              <CommissionTracking />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/inventory" element={
          <RoleProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN', 'PHARMACIST']}>
            <MainLayout>
              <InventoryPage />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/reports" element={
          <RoleProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN', 'PHARMACIST', 'CASHIER']}>
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
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'PRODUCT_OWNER']}>
            <MainLayout>
              <UserManagement />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin/employees" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']}>
            <MainLayout>
              <EmployeeManagement />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin/roles" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'PRODUCT_OWNER']}>
            <MainLayout>
              <RoleManagement />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <MainLayout>
              <AdminReports />
            </MainLayout>
          </RoleProtectedRoute>
        } />
        
        {/* SuperAdmin Routes */}
        <Route path="/superadmin" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'PRODUCT_OWNER']}>
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
