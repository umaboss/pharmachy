import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Star,
  RefreshCw
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const Reports = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedReport, setSelectedReport] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [previousPeriodData, setPreviousPeriodData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByPaymentMethod, setSalesByPaymentMethod] = useState<any[]>([]);

  const periods = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" }
  ];

  const reportTypes = [
    { id: "sales", label: "Sales Report", icon: DollarSign },
    { id: "inventory", label: "Inventory Report", icon: Package },
    { id: "customers", label: "Customer Report", icon: Users },
    { id: "products", label: "Product Performance", icon: BarChart3 }
  ];

  // Load report data when period or report type changes
  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedReport]);

  // Auto-refresh when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadReportData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const testAPI = async () => {
    try {
      console.log('Testing API directly...');
      const response = await fetch('http://localhost:5000/api/reports/sales', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Direct API response status:', response.status);
      const data = await response.json();
      console.log('Direct API response data:', data);
    } catch (error) {
      console.error('Direct API test error:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get branch ID - use user's branch or get first available branch
      let branchId = user?.branchId;
      if (!branchId) {
        const branchesResponse = await apiService.getBranches();
        if (branchesResponse.success && branchesResponse.data?.branches?.length > 0) {
          branchId = branchesResponse.data.branches[0].id;
        }
      }

      // Calculate date range based on selected period
      const now = new Date();
      let startDate = '';
      let endDate = '';
      let previousStartDate = '';
      let previousEndDate = '';

      switch (selectedPeriod) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          previousStartDate = yesterday.toISOString().split('T')[0];
          previousEndDate = yesterday.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          const twoWeeksAgo = new Date(now);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          previousStartDate = twoWeeksAgo.toISOString().split('T')[0];
          previousEndDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = monthAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          const twoMonthsAgo = new Date(now);
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          previousStartDate = twoMonthsAgo.toISOString().split('T')[0];
          previousEndDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          startDate = yearAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          const twoYearsAgo = new Date(now);
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          previousStartDate = twoYearsAgo.toISOString().split('T')[0];
          previousEndDate = yearAgo.toISOString().split('T')[0];
          break;
      }

      // Load current period data
      console.log('Loading report data with params:', {
        selectedReport,
        selectedPeriod,
        startDate,
        endDate,
        branchId: branchId || ""
      });

      let response;
      switch (selectedReport) {
        case 'sales':
          // For debugging, let's try without date filters first
          const salesParams = {
            // startDate,
            // endDate,
            branchId: branchId || "",
            groupBy: (selectedPeriod === 'month' || selectedPeriod === 'year' ? 'month' : 'day') as 'day' | 'month'
          };
          console.log('Sales report params (debug mode - no date filter):', salesParams);
          response = await apiService.getSalesReport(salesParams);
          break;
        case 'inventory':
          response = await apiService.getInventoryReport({
            branchId: branchId || ""
          });
          break;
        case 'customers':
          response = await apiService.getCustomerReport({
            startDate,
            endDate,
            branchId: branchId || ""
          });
          break;
        case 'products':
          response = await apiService.getProductPerformanceReport({
            startDate,
            endDate,
            branchId: branchId || ""
          });
          break;
        default:
          response = await apiService.getSalesReport({
            startDate,
            endDate,
            branchId: branchId || ""
          });
      }

      // Load previous period data for growth calculations (only for sales and customers)
      let previousResponse = null;
      if ((selectedReport === 'sales' || selectedReport === 'customers') && previousStartDate && previousEndDate) {
        try {
          if (selectedReport === 'sales') {
            previousResponse = await apiService.getSalesReport({
              startDate: previousStartDate,
              endDate: previousEndDate,
              branchId: branchId || "",
              groupBy: selectedPeriod === 'month' || selectedPeriod === 'year' ? 'month' : 'day'
            });
          } else if (selectedReport === 'customers') {
            previousResponse = await apiService.getCustomerReport({
              startDate: previousStartDate,
              endDate: previousEndDate,
              branchId: branchId || ""
            });
          }
        } catch (err) {
          console.warn('Could not load previous period data:', err);
        }
      }

      if (response.success && response.data) {
        console.log('Report data loaded:', response.data);
        setReportData(response.data);
        if (previousResponse?.success && previousResponse.data) {
          console.log('Previous period data loaded:', previousResponse.data);
          setPreviousPeriodData(previousResponse.data);
        }

        // Load additional data for sales report
        if (selectedReport === 'sales') {
          // Load top selling products
          try {
            const topProductsResponse = await apiService.getTopSellingProducts(branchId || '', 10);
            if (topProductsResponse.success && topProductsResponse.data) {
              setTopProducts(topProductsResponse.data);
            }
          } catch (err) {
            console.error('Error loading top products:', err);
          }

          // Load sales by payment method
          try {
            const paymentMethodResponse = await apiService.getSalesByPaymentMethod(branchId || '');
            if (paymentMethodResponse.success && paymentMethodResponse.data) {
              setSalesByPaymentMethod(paymentMethodResponse.data);
            }
          } catch (err) {
            console.error('Error loading sales by payment method:', err);
          }
        }
      } else {
        console.error('Report API failed:', response);
        setError('Failed to load report data: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get current data based on selected report type
  const getCurrentData = () => {
    if (!reportData) {
      console.log('No report data available');
      return null;
    }
    
    console.log('Processing report data:', reportData);

    switch (selectedReport) {
      case 'sales':
        const currentRevenue = reportData.summary?.totalRevenue || 0;
        const currentTransactions = reportData.summary?.totalSales || 0;
        const previousRevenue = previousPeriodData?.summary?.totalRevenue || 0;
        const previousTransactions = previousPeriodData?.summary?.totalSales || 0;
        
        console.log('Sales data:', {
          currentRevenue,
          currentTransactions,
          previousRevenue,
          previousTransactions,
          summary: reportData.summary
        });
        
        return {
          revenue: currentRevenue,
          transactions: currentTransactions,
          customers: 0, // This would need to be calculated separately
          avgTransaction: currentTransactions > 0 ? currentRevenue / currentTransactions : 0,
          revenueGrowth: calculateGrowth(currentRevenue, previousRevenue),
          transactionGrowth: calculateGrowth(currentTransactions, previousTransactions)
        };
      case 'inventory':
        return {
          totalProducts: reportData.summary?.totalProducts || 0,
          totalStock: reportData.summary?.totalStock || 0,
          lowStockCount: reportData.summary?.lowStockCount || 0
        };
      case 'customers':
        const currentCustomers = reportData.summary?.totalCustomers || 0;
        const currentSpent = reportData.summary?.totalSpent || 0;
        const currentAvgSpent = reportData.summary?.averageSpent || 0;
        const previousCustomers = previousPeriodData?.summary?.totalCustomers || 0;
        const previousSpent = previousPeriodData?.summary?.totalSpent || 0;
        
        return {
          totalCustomers: currentCustomers,
          totalSpent: currentSpent,
          averageSpent: currentAvgSpent,
          loyaltyPoints: reportData.summary?.totalLoyaltyPoints || 0,
          customerGrowth: calculateGrowth(currentCustomers, previousCustomers),
          spendingGrowth: calculateGrowth(currentSpent, previousSpent)
        };
      default:
        return null;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Insights into your pharmacy performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={testAPI}
          >
            Test API
          </Button>
          <Button 
            variant="outline" 
            onClick={loadReportData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
          <Button variant="medical">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Period and Report Type Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle>Time Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {periods.map((period) => (
                <Button
                  key={period.id}
                  variant={selectedPeriod === period.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.id)}
                  className="w-full"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle>Report Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map((report) => {
                const IconComponent = report.icon;
                return (
                  <Button
                    key={report.id}
                    variant={selectedReport === report.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedReport(report.id)}
                    className="w-full justify-start"
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {report.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="shadow-soft border-0">
          <CardContent className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="shadow-soft border-0">
          <CardContent className="p-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadReportData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {!loading && !error && currentData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {selectedReport === 'sales' && (
            <>
              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold text-foreground">PKR {currentData.revenue.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        {currentData.revenueGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive mr-1" />
                        )}
                        <span className={`text-sm font-medium ${currentData.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {currentData.revenueGrowth >= 0 ? '+' : ''}{currentData.revenueGrowth}%
                        </span>
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold text-foreground">{currentData.transactions.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        {currentData.transactionGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive mr-1" />
                        )}
                        <span className={`text-sm font-medium ${currentData.transactionGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {currentData.transactionGrowth >= 0 ? '+' : ''}{currentData.transactionGrowth}%
                        </span>
                      </div>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                      <p className="text-2xl font-bold text-foreground">PKR {Math.round(currentData.avgTransaction)}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 text-success mr-1" />
                        <span className="text-sm text-success font-medium">Real-time</span>
                      </div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedReport === 'inventory' && (
            <>
              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold text-foreground">{currentData.totalProducts.toLocaleString()}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
                      <p className="text-2xl font-bold text-foreground">{currentData.totalStock.toLocaleString()}</p>
                    </div>
                    <Package className="w-8 h-8 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                      <p className="text-2xl font-bold text-foreground text-warning">{currentData.lowStockCount}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedReport === 'customers' && (
            <>
              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                      <p className="text-2xl font-bold text-foreground">{currentData.totalCustomers.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        {currentData.customerGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive mr-1" />
                        )}
                        <span className={`text-sm font-medium ${currentData.customerGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {currentData.customerGrowth >= 0 ? '+' : ''}{currentData.customerGrowth}%
                        </span>
                      </div>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold text-foreground">PKR {currentData.totalSpent.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        {currentData.spendingGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive mr-1" />
                        )}
                        <span className={`text-sm font-medium ${currentData.spendingGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {currentData.spendingGrowth >= 0 ? '+' : ''}{currentData.spendingGrowth}%
                        </span>
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Spent</p>
                      <p className="text-2xl font-bold text-foreground">PKR {Math.round(currentData.averageSpent)}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                      <p className="text-2xl font-bold text-foreground">{currentData.loyaltyPoints.toLocaleString()}</p>
                    </div>
                    <Star className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Charts and Details Grid */}
      {!loading && !error && reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products - Only for Sales Report */}
          {selectedReport === 'sales' && reportData.topProducts && (
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Top Selling Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topProducts.slice(0, 5).map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-surface rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.product?.name || 'Unknown Product'}</p>
                          <p className="text-sm text-muted-foreground">{product._sum?.quantity || 0} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">PKR {(product._sum?.totalPrice || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{product.product?.category?.name || 'Unknown Category'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales by Category - Only for Sales Report */}
          {/* Sales by Payment Method - Using loaded data */}
          {selectedReport === 'sales' && salesByPaymentMethod.length > 0 && (
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  <span>Sales by Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesByPaymentMethod.map((payment: any, index: number) => {
                    const total = salesByPaymentMethod.reduce((sum, p) => sum + (p._sum?.totalAmount || 0), 0);
                    const percentage = total > 0 ? ((payment._sum?.totalAmount || 0) / total) * 100 : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{payment.paymentMethod}</span>
                          <div className="text-right">
                            <span className="font-semibold text-foreground">{percentage.toFixed(1)}%</span>
                            <p className="text-xs text-muted-foreground">PKR {(payment._sum?.totalAmount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
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
          )}

          {/* Top Selling Products - Using loaded data */}
          {selectedReport === 'sales' && topProducts.length > 0 && (
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Top Selling Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.slice(0, 10).map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-surface rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.product?.name || 'Unknown Product'}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.product?.category?.name || 'Unknown Category'} • {product.product?.unitType || 'units'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{product.totalQuantity.toLocaleString()} sold</p>
                        <p className="text-xs text-muted-foreground">PKR {product.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Customers - Only for Customer Report */}
          {selectedReport === 'customers' && reportData.topCustomers && (
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Top Customers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-surface rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">PKR {customer.totalPurchases.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{customer.loyaltyPoints} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Products - Only for Inventory Report */}
          {selectedReport === 'inventory' && reportData.lowStockProducts && (
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-warning" />
                  <span>Low Stock Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.lowStockProducts.slice(0, 5).map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-surface rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-warning">!</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category?.name || 'Unknown Category'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-warning">{product.stock} left</p>
                        <p className="text-xs text-muted-foreground">Min: {product.minStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
};

export default Reports;