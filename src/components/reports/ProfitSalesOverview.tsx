import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, RefreshCw } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const ProfitSalesOverview = () => {
  const { user } = useAuth();
  const [overviewData, setOverviewData] = useState({
    totalSales: 0,
    totalProfit: 0,
    salesGrowth: 0,
    profitGrowth: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Get branch ID
      let branchId = user?.branchId;
      if (!branchId) {
        const branchesResponse = await apiService.getBranches();
        if (branchesResponse.success && branchesResponse.data?.branches?.length > 0) {
          branchId = branchesResponse.data.branches[0].id;
        }
      }

      // Get current month sales data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get previous month for comparison
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch current month sales
      const currentMonthResponse = await apiService.getSalesReport({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        branchId: branchId || "",
        groupBy: 'month'
      });

      // Fetch previous month sales
      const previousMonthResponse = await apiService.getSalesReport({
        startDate: startOfPreviousMonth.toISOString().split('T')[0],
        endDate: endOfPreviousMonth.toISOString().split('T')[0],
        branchId: branchId || "",
        groupBy: 'month'
      });

      if (currentMonthResponse.success) {
        const currentData = currentMonthResponse.data;
        const previousData = previousMonthResponse.success ? previousMonthResponse.data : null;

        const totalSales = currentData.summary?.totalRevenue || 0;
        const totalProfit = (currentData.summary?.totalRevenue || 0) * 0.3; // Assuming 30% profit margin
        const totalOrders = currentData.summary?.totalSales || 0;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Calculate growth percentages
        const salesGrowth = previousData ? 
          ((totalSales - (previousData.summary?.totalRevenue || 0)) / (previousData.summary?.totalRevenue || 1)) * 100 : 0;
        const profitGrowth = previousData ? 
          ((totalProfit - ((previousData.summary?.totalRevenue || 0) * 0.3)) / ((previousData.summary?.totalRevenue || 1) * 0.3)) * 100 : 0;

        setOverviewData({
          totalSales,
          totalProfit,
          salesGrowth: Math.round(salesGrowth * 10) / 10,
          profitGrowth: Math.round(profitGrowth * 10) / 10,
          totalOrders,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100
        });
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-soft border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadOverviewData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Sales */}
      <Card className="shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Sales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            PKR {overviewData.totalSales.toLocaleString()}
          </div>
          <div className={`flex items-center text-xs mt-1 ${overviewData.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overviewData.salesGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {overviewData.salesGrowth >= 0 ? '+' : ''}{overviewData.salesGrowth}% from last month
          </div>
        </CardContent>
      </Card>

      {/* Total Profit */}
      <Card className="shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            PKR {overviewData.totalProfit.toLocaleString()}
          </div>
          <div className={`flex items-center text-xs mt-1 ${overviewData.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overviewData.profitGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {overviewData.profitGrowth >= 0 ? '+' : ''}{overviewData.profitGrowth}% from last month
          </div>
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Orders
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {overviewData.totalOrders.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            This month
          </div>
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card className="shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avg Order Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            PKR {overviewData.averageOrderValue.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            Per order
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ProfitSalesOverview;