import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Wifi,
  Clock,
  DollarSign,
  Pill,
  Calendar,
  Building2,
  UserPlus,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Eye,
  CheckCircle,
  X
} from "lucide-react";
import { apiService } from "@/services/api";

const AdminDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [branchDetails, setBranchDetails] = useState<any>(null);
  const [showBranchDetails, setShowBranchDetails] = useState(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [showAllRecentSales, setShowAllRecentSales] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load admin dashboard stats and top products in parallel
      const [dashboardResponse, topProductsResponse] = await Promise.all([
        apiService.getAdminDashboardStats(),
        apiService.getTopSellingProducts(undefined, 10) // Load top 10 products from all branches
      ]);
      
      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
      } else {
        setError('Failed to load dashboard data');
      }

      if (topProductsResponse.success && topProductsResponse.data) {
        setTopProducts(topProductsResponse.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  const handleBranchClick = async (branch: any) => {
    try {
      setSelectedBranch(branch);
      setLoading(true);
      
      // Load branch-specific data
      const [dashboardResponse, lowStockResponse, customersResponse] = await Promise.all([
        apiService.getDashboardStats(branch.id),
        apiService.getLowStockProducts(branch.id),
        apiService.getCustomers({ branchId: branch.id, limit: 10 })
      ]);

      if (dashboardResponse.success && dashboardResponse.data) {
        setBranchDetails({
          ...dashboardResponse.data,
          lowStockProducts: lowStockResponse.success ? lowStockResponse.data.products : [],
          recentCustomers: customersResponse.success ? customersResponse.data.customers : [],
          branchInfo: branch
        });
        setShowBranchDetails(true);
      }
    } catch (err) {
      console.error('Error loading branch details:', err);
      setError('Failed to load branch details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadDashboardData}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const adminStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData?.totalRevenue || 0),
      change: "+23.4%",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Total Sales",
      value: formatCurrency(dashboardData?.totalRevenue || 0),
      change: "+18.2%",
      icon: ShoppingCart,
      trend: "up"
    },
    {
      title: "Active Users",
      value: dashboardData?.totalUsers?.toString() || "0",
      change: "+12",
      icon: Users,
      trend: "up"
    },
    {
      title: "Total Branches",
      value: dashboardData?.totalBranches?.toString() || "0",
      change: "+2",
      icon: Building2,
      trend: "up"
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete overview of all pharmacy operations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className={isOnline ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
            <Wifi className="w-3 h-3 mr-1" />
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Jan 15, 2024</p>
            <p className="text-xs text-muted-foreground">Tuesday • 10:30 AM</p>
          </div>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="shadow-soft border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${
                        stat.trend === 'up' ? 'bg-success/10 text-success border-success/20' :
                        stat.trend === 'warning' ? 'bg-warning/10 text-warning border-warning/20' :
                        'bg-muted/50 text-muted-foreground border-border'
                      }`}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    stat.trend === 'up' ? 'bg-success/10' :
                    stat.trend === 'warning' ? 'bg-warning/10' :
                    'bg-primary/10'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      stat.trend === 'up' ? 'text-success' :
                      stat.trend === 'warning' ? 'text-warning' :
                      'text-primary'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Sales and Low Stock Alert in one row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales - Takes 2/3 of the width */}
        <Card className="lg:col-span-2 shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span>Recent Sales</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.recentSales?.length > 0 ? (
                <>
                  {(showAllRecentSales ? dashboardData.recentSales : dashboardData.recentSales.slice(0, 4)).map((sale: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground text-sm">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(sale.totalAmount)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Branch: {sale.branch?.name}</p>
                        <p>Cashier: {sale.user?.name}</p>
                        <p>Time: {formatDate(sale.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {dashboardData.recentSales.length > 4 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => setShowAllRecentSales(!showAllRecentSales)}
                    >
                      {showAllRecentSales ? 'Show Less' : `View More (${dashboardData.recentSales.length - 4} more)`}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent sales found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert - Takes 1/3 of the width */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.lowStockProducts?.length > 0 ? (
                <>
                  {(showAllLowStock ? dashboardData.lowStockProducts : dashboardData.lowStockProducts.slice(0, 4)).map((product: any, index: number) => (
                    <div key={index} className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                          {product.stock} {product.unitType}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Branch: {product.branch?.name}</p>
                        <p>Min Stock: {product.minStock} {product.unitType}</p>
                      </div>
                    </div>
                  ))}
                  {dashboardData.lowStockProducts.length > 4 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => setShowAllLowStock(!showAllLowStock)}
                    >
                      {showAllLowStock ? 'Show Less' : `View More (${dashboardData.lowStockProducts.length - 4} more)`}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-success font-medium text-lg">All products are well stocked!</p>
                  <p className="text-muted-foreground text-sm mt-2">No low stock alerts at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Performance */}
        <Card className="lg:col-span-2 shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Branch Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.branchPerformance?.length > 0 ? (
                dashboardData.branchPerformance.map((branch: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-gradient-surface rounded-lg hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => handleBranchClick(branch)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {branch.users} users • {branch.sales} sales • {formatCurrency(branch.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {branch.sales} sales
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No branch data available</p>
              )}
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View All Branches
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Recent Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.recentUsers?.length > 0 ? (
                dashboardData.recentUsers.map((user: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground text-sm">{user.name}</p>
                      <Badge variant="outline" className="text-xs">{user.username}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Branch: {user.branch}</p>
                      <p>Last Purchase: {user.lastPurchase ? getTimeAgo(user.lastPurchase) : 'No purchases'}</p>
                      {user.lastPurchaseAmount > 0 && (
                        <p>Amount: {formatCurrency(user.lastPurchaseAmount)}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent users found</p>
              )}
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={() => window.location.href = '/admin/users'}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Top Selling Products (All Branches)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Units Sold</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sales Count</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((product: any, index: number) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-foreground">{product.product?.name || 'Unknown Product'}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.product?.category?.name || 'Unknown Category'} • {product.product?.unitType || 'units'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {product.totalQuantity?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 px-4 font-semibold text-foreground">
                        {formatCurrency(product.totalRevenue || 0)}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {product.salesCount?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                      No top products data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* Branch Details Modal */}
      {showBranchDetails && branchDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{branchDetails.branchInfo?.name} Dashboard</h2>
                  <p className="text-muted-foreground">Branch-specific overview and analytics</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBranchDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Branch Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-soft border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(branchDetails.totalStats?.revenue || 0)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                        <p className="text-xl font-bold text-foreground">{(branchDetails.totalStats?.sales || 0).toLocaleString()}</p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Products</p>
                        <p className="text-xl font-bold text-foreground">{(branchDetails.inventory?.totalProducts || 0).toLocaleString()}</p>
                      </div>
                      <Package className="w-8 h-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Customers</p>
                        <p className="text-xl font-bold text-foreground">{(branchDetails.customers?.total || 0).toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      <span>Recent Sales</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {branchDetails.recentSales?.length > 0 ? (
                        branchDetails.recentSales.map((sale: any, index: number) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-foreground text-sm">
                                {sale.customer?.name || 'Walk-in Customer'}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(sale.totalAmount)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>Cashier: {sale.user?.name}</p>
                              <p>Time: {formatDate(sale.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No recent sales found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Customers */}
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span>Recent Customers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {branchDetails.recentCustomers?.length > 0 ? (
                        branchDetails.recentCustomers.map((customer: any, index: number) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-foreground text-sm">{customer.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(customer.totalPurchases || 0)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>Phone: {customer.phone}</p>
                              <p>Points: {customer.loyaltyPoints || 0}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No customers found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Alert */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <span>Low Stock Alert - {branchDetails.branchInfo?.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {branchDetails.lowStockProducts?.length > 0 ? (
                      branchDetails.lowStockProducts.map((product: any, index: number) => (
                        <div key={index} className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-foreground text-sm">{product.name}</p>
                            <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                              {product.stock} {product.unitType}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>Min Stock: {product.minStock} {product.unitType}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-success" />
                        </div>
                        <p className="text-success font-medium text-lg">All products are well stocked!</p>
                        <p className="text-muted-foreground text-sm mt-2">No low stock alerts for this branch</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
