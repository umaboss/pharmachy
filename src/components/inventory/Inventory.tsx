import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  AlertTriangle,
  Calendar,
  Barcode,
  Edit,
  Trash2,
  Download,
  Upload,
  Pill,
  Droplets,
  Syringe,
  X,
  Save,
  Loader2
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  description?: string;
  category: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unitType: string;
  unitsPerPack: number;
  barcode?: string;
  requiresPrescription: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
}

const Inventory = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Form state for adding new medicine
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    description: "",
    categoryId: "",
    supplierId: "",
    costPrice: "",
    sellingPrice: "",
    stock: "",
    minStock: "",
    maxStock: "",
    unitType: "",
    unitsPerPack: "",
    barcode: "",
    requiresPrescription: false
  });

  const unitTypes = ["tablets", "capsules", "bottles", "vials", "syrups", "injections"];

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get branch ID - use user's branch or get first available branch
      let branchId = user?.branchId;
      console.log('Current user:', user);
      console.log('User branchId:', branchId);
      
      if (!branchId) {
        // If no user logged in, get the first available branch
        console.log('No user branchId, fetching branches...');
        const branchesResponse = await apiService.getBranches();
        console.log('Branches response:', branchesResponse);
        if (branchesResponse.success && branchesResponse.data?.branches?.length > 0) {
          branchId = branchesResponse.data.branches[0].id;
          console.log('Using first available branch:', branchId);
        }
      }

      // Load products, categories, and suppliers in parallel
      const [productsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
        apiService.getProducts({
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          category: selectedCategory === "all" ? "" : selectedCategory,
          branchId: branchId || ""
        }),
        apiService.getCategories({ limit: 100 }),
        apiService.getSuppliers({ limit: 100, active: true })
      ]);

      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data.products);
        setPagination(productsResponse.data.pagination);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data.categories);
      }

      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data.suppliers);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalProducts = pagination.total;
  const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { status: "out", color: "destructive" };
    if (stock <= minStock) return { status: "low", color: "warning" };
    return { status: "good", color: "success" };
  };

  const getUnitIcon = (unitType: string) => {
    switch (unitType) {
      case "tablets":
      case "capsules":
        return <Pill className="w-4 h-4" />;
      case "bottles":
        return <Droplets className="w-4 h-4" />;
      case "vials":
        return <Syringe className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const generateBatchNumber = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    return `BT${randomNum.toString().padStart(3, '0')}`;
  };

  const generateBarcode = () => {
    const randomNum = Math.floor(Math.random() * 10000000000000);
    return randomNum.toString().padStart(13, '0');
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.categoryId || !newMedicine.supplierId || !newMedicine.sellingPrice || !newMedicine.stock) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      setLoading(true);
      
      // Get branch ID - use user's branch or get first available branch
      let branchId = user?.branchId;
      if (!branchId) {
        const branchesResponse = await apiService.getBranches();
        if (branchesResponse.success && branchesResponse.data?.branches?.length > 0) {
          branchId = branchesResponse.data.branches[0].id;
        }
      }

      if (!branchId) {
        alert("No branch available. Please contact administrator.");
        return;
      }
      
      const productData = {
        name: newMedicine.name,
        description: newMedicine.description,
        categoryId: newMedicine.categoryId,
        supplierId: newMedicine.supplierId,
        branchId: branchId,
        costPrice: parseFloat(newMedicine.costPrice) || 0,
        sellingPrice: parseFloat(newMedicine.sellingPrice),
        stock: parseInt(newMedicine.stock),
        minStock: parseInt(newMedicine.minStock) || 10,
        maxStock: newMedicine.maxStock ? parseInt(newMedicine.maxStock) : undefined,
        unitType: newMedicine.unitType || "tablets",
        unitsPerPack: parseInt(newMedicine.unitsPerPack) || 10,
        barcode: newMedicine.barcode || undefined,
        requiresPrescription: newMedicine.requiresPrescription
      };

      console.log('Creating product with data:', productData);
      const response = await apiService.createProduct(productData);
      console.log('Product creation response:', response);
      
      if (response.success) {
        // Reload data to get the updated list
        await loadData();
        
        // Reset form
        setNewMedicine({
          name: "",
          description: "",
          categoryId: "",
          supplierId: "",
          costPrice: "",
          sellingPrice: "",
          stock: "",
          minStock: "",
          maxStock: "",
          unitType: "",
          unitsPerPack: "",
          barcode: "",
          requiresPrescription: false
        });
        
        setIsAddDialogOpen(false);
        alert("Medicine added successfully!");
      } else {
        alert(response.message || "Failed to add medicine");
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert("Failed to add medicine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      try {
        setLoading(true);
        const response = await apiService.deleteProduct(id);
        
        if (response.success) {
          await loadData();
          alert("Medicine deleted successfully!");
        } else {
          alert(response.message || "Failed to delete medicine");
        }
      } catch (error) {
        console.error('Error deleting medicine:', error);
        alert("Failed to delete medicine. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Inventory</h1>
          <p className="text-muted-foreground">Track and manage your medicine stock</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          
          {/* Add Medicine Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Add New Medicine</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Paracetamol 500mg"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newMedicine.categoryId} onValueChange={(value) => setNewMedicine({...newMedicine, categoryId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the medicine..."
                      value={newMedicine.description}
                      onChange={(e) => setNewMedicine({...newMedicine, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitType">Unit Type</Label>
                    <Select value={newMedicine.unitType} onValueChange={(value) => setNewMedicine({...newMedicine, unitType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitsPerPack">Units per Pack</Label>
                    <Input
                      id="unitsPerPack"
                      type="number"
                      placeholder="e.g., 20"
                      value={newMedicine.unitsPerPack}
                      onChange={(e) => setNewMedicine({...newMedicine, unitsPerPack: e.target.value})}
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Pricing & Stock</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (PKR)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      placeholder="e.g., 60"
                      value={newMedicine.costPrice}
                      onChange={(e) => setNewMedicine({...newMedicine, costPrice: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price (PKR) *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      placeholder="e.g., 85"
                      value={newMedicine.sellingPrice}
                      onChange={(e) => setNewMedicine({...newMedicine, sellingPrice: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Current Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="e.g., 150"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({...newMedicine, stock: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStock">Minimum Stock Level</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="e.g., 50"
                      value={newMedicine.minStock}
                      onChange={(e) => setNewMedicine({...newMedicine, minStock: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select value={newMedicine.supplierId} onValueChange={(value) => setNewMedicine({...newMedicine, supplierId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Maximum Stock Level</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      placeholder="e.g., 200"
                      value={newMedicine.maxStock}
                      onChange={(e) => setNewMedicine({...newMedicine, maxStock: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="barcode"
                        placeholder="e.g., 1234567890123"
                        value={newMedicine.barcode}
                        onChange={(e) => setNewMedicine({...newMedicine, barcode: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setNewMedicine({...newMedicine, barcode: generateBarcode()})}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="requiresPrescription"
                      type="checkbox"
                      checked={newMedicine.requiresPrescription}
                      onChange={(e) => setNewMedicine({...newMedicine, requiresPrescription: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="requiresPrescription">Requires Prescription</Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddMedicine}
                  className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Add Medicine
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Medicines</p>
                <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">PKR {totalValue.toLocaleString()}</p>
              </div>
              <Calendar className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{categories.length}</p>
              </div>
              <Filter className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, barcode, batch, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`capitalize ${
                    selectedCategory === category.id
                      ? "text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)]"
                      : ""
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle>Medicines ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading medicines...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
              <Button onClick={loadData} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Medicine</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Unit Info</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Supplier</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock, product.minStock);
                    return (
                      <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            {product.barcode && (
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Barcode className="w-3 h-3 mr-1" />
                                {product.barcode}
                              </p>
                            )}
                            {product.description && (
                              <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">{product.category.name}</Badge>
                        </td>
                        <td className="py-4 px-4 font-medium text-foreground">
                          PKR {product.sellingPrice}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{product.stock}</span>
                            <Badge variant="outline" className={`
                              ${stockStatus.color === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                              ${stockStatus.color === 'warning' ? 'bg-warning/10 text-warning border-warning/20' : ''}
                              ${stockStatus.color === 'success' ? 'bg-success/10 text-success border-success/20' : ''}
                            `}>
                              {stockStatus.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getUnitIcon(product.unitType)}
                            <div className="text-sm">
                              <p className="font-medium capitalize">{product.unitType}</p>
                              <p className="text-muted-foreground">{product.unitsPerPack} per pack</p>
                            </div>
                          </div>
                          {product.requiresPrescription && (
                            <Badge variant="destructive" className="text-xs mt-1">Rx Required</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {product.supplier.name}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteMedicine(product.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;