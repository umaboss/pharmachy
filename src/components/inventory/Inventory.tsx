import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  AlertTriangle,
  AlertCircle,
  Barcode,
  Edit,
  Trash2,
  Pill,
  RefreshCw,
  Droplets,
  Syringe,
  X,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  FileSpreadsheet,
  Image
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
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

const Inventory = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const [processingImage, setProcessingImage] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Form state for adding new medicine
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    categoryId: "",
    costPrice: "",
    sellingPrice: "",
    stock: "",
    minStock: "",
    maxStock: "",
    unitsPerPack: "",
    barcode: ""
  });

  // Form state for creating new category
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });


  // Load data on component mount
  useEffect(() => {
    console.log('Component mounted, loading data...');
    loadData();
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== LOAD DATA DEBUG ===');
      console.log('User object:', user);
      console.log('User branchId:', user?.branchId);
      console.log('Is user authenticated:', !!user);
      
      // Check localStorage directly
      const storedUser = localStorage.getItem('user');
      const storedMedibillUser = localStorage.getItem('medibill_user');
      console.log('Stored user (localStorage):', storedUser);
      console.log('Stored medibill_user (localStorage):', storedMedibillUser);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed stored user:', parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      // Get branchId - try multiple sources
      let branchId = user?.branchId;
      
      // If no branchId from user object, try to get it from localStorage
      if (!branchId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            branchId = parsedUser.branch?.id;
            console.log('Got branchId from localStorage:', branchId);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
      
      // If still no branchId, get the first available branch
      if (!branchId) {
        console.log('No branchId found, fetching first available branch...');
        try {
          const branchesResponse = await apiService.getBranches();
          if (branchesResponse.success && branchesResponse.data?.branches?.length > 0) {
            branchId = branchesResponse.data.branches[0].id;
            console.log('Using first available branch:', branchId);
          }
        } catch (e) {
          console.error('Error fetching branches:', e);
        }
      }

      // Load products from database
      const response = await apiService.getProducts({ 
        limit: 1000,
        branchId: branchId 
      });
      console.log('Products API response:', response);
      console.log('Requesting products for branchId:', branchId);
      
      if (response.success && response.data) {
        const allProducts = response.data.products;
        console.log('Total products from API:', allProducts.length);
        console.log('All products:', allProducts);
        
        // Filter products based on search and category
        let filteredProducts = allProducts;
        
        if (searchQuery) {
          console.log('Filtering by search query:', searchQuery);
          filteredProducts = filteredProducts.filter((product: any) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.barcode?.includes(searchQuery)
          );
          console.log('Products after search filter:', filteredProducts.length);
        }
        
        if (selectedCategory !== "all") {
          console.log('Filtering by category:', selectedCategory);
          filteredProducts = filteredProducts.filter((product: any) =>
            product.categoryId === selectedCategory
          );
          console.log('Products after category filter:', filteredProducts.length);
        }
        
        // Apply pagination
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        // TEMPORARY: Show all products without pagination for debugging
        console.log('TEMPORARY DEBUG: Showing all products without pagination');
        const debugProducts = filteredProducts; // Show all products
        
        console.log('Setting products in loadData:', {
          allProducts: allProducts.length,
          filteredProducts: filteredProducts.length,
          paginatedProducts: paginatedProducts.length,
          startIndex,
          endIndex,
          currentPage: pagination.page,
          limit: pagination.limit,
          allProductsData: allProducts,
          filteredProductsData: filteredProducts,
          paginatedProductsData: paginatedProducts
        });
        
        setProducts(debugProducts); // TEMPORARY: Use debug products
        setPagination({
          page: pagination.page,
          limit: pagination.limit,
          total: filteredProducts.length,
          pages: Math.ceil(filteredProducts.length / pagination.limit)
        });
        
        console.log('Final products set to state:', debugProducts.length);
        console.log('Final products data:', debugProducts);
      } else {
        setProducts([]);
        setPagination({
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        });
      }

      // Load categories from database
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data.categories);
      } else {
        // Fallback to empty array if no categories found
        setCategories([]);
      }
      
      // Load suppliers from database
      const suppliersResponse = await apiService.getSuppliers();
      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data.suppliers);
      } else {
        console.error('Failed to load suppliers:', suppliersResponse.message);
        // Set default suppliers if API fails
        setSuppliers([
          { id: "sup_001", name: "Default Supplier", contactPerson: "John Doe", phone: "+92 300 1234567", email: "contact@supplier.com", address: "123 Supplier St", isActive: true }
        ]);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      
      // Check if it's a connection error
      if (err.message && err.message.includes('Failed to fetch')) {
        setError('⚠️ Backend server is not running. Please start the server and refresh the page.');
      } else {
        setError('Failed to load inventory data');
      }
      
      // Set fallback data when server is not available
      setProducts([]);
      setCategories([
        { id: 'cat_001', name: 'Pain Relief' },
        { id: 'cat_002', name: 'Antibiotics' },
        { id: 'cat_003', name: 'Vitamins' },
        { id: 'cat_004', name: 'Cold & Flu' },
        { id: 'cat_005', name: 'Digestive Health' }
      ]);
      setSuppliers([
        { id: 'sup_001', name: 'Default Supplier', contactPerson: 'John Doe', phone: '+92 300 1234567', email: 'contact@supplier.com', address: '123 Supplier St', isActive: true }
      ]);
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
    return { status: "good", color: "default" };
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

  const generateBarcode = () => {
    const randomNum = Math.floor(Math.random() * 10000000000000);
    return randomNum.toString().padStart(13, '0');
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      alert("Please enter category name!");
      return;
    }

    try {
      setLoading(true);
      
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description || ""
      };
      
      // Create category via API
      const response = await apiService.createCategory(categoryData);
      
      if (response.success) {
        console.log('Category created successfully:', response.data);
        
        // Reload data to get the updated list
        await loadData();
        
        // Reset form
        setNewCategory({
          name: "",
          description: ""
        });
        
        setIsCreateCategoryDialogOpen(false);
        alert("Category created successfully!");
      } else {
        alert(response.message || "Failed to create category");
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert("Failed to create category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.categoryId || !newMedicine.sellingPrice || !newMedicine.stock) {
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

      // Use default supplier - no need to fetch suppliers
      const supplierId = 'default-supplier';
      
      const productData = {
        name: newMedicine.name,
        description: "",
        categoryId: newMedicine.categoryId,
        supplierId: supplierId,
        branchId: branchId,
        costPrice: parseFloat(newMedicine.costPrice) || 0,
        sellingPrice: parseFloat(newMedicine.sellingPrice),
        stock: parseInt(newMedicine.stock),
        minStock: parseInt(newMedicine.minStock) || 10,
        maxStock: newMedicine.maxStock ? parseInt(newMedicine.maxStock) : null,
        unitType: "tablets", // Default unit type
        unitsPerPack: parseInt(newMedicine.unitsPerPack) || 10,
        barcode: newMedicine.barcode || null,
        requiresPrescription: false, // Default to false
        isActive: true
      };

      console.log('Creating product with data:', productData);
      console.log('Using branchId for product creation:', branchId);
      console.log('User branchId:', user?.branchId);
      
      // Create product via API
      const response = await apiService.createProduct(productData);
      
      if (response.success) {
        console.log('Product created successfully:', response.data);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('productCreated', { 
          detail: { product: response.data } 
        }));
        
        // Reload data to get the updated list - fetch products for the current branch
        try {
          const allProductsResponse = await apiService.getProducts({ 
            limit: 1000,
            branchId: branchId 
          });
          console.log('Product reload response:', allProductsResponse);
          if (allProductsResponse.success && allProductsResponse.data) {
            const allProducts = allProductsResponse.data.products;
            console.log('Products found after creation:', allProducts.length);
            
            // If no products found with branch filter, try without branch filter
            if (allProducts.length === 0) {
              console.log('No products found with branch filter, trying without branch filter...');
              const allProductsResponseNoFilter = await apiService.getProducts({ limit: 1000 });
              if (allProductsResponseNoFilter.success && allProductsResponseNoFilter.data) {
                const allProductsNoFilter = allProductsResponseNoFilter.data.products;
                console.log('Total products (no filter):', allProductsNoFilter.length);
                
                // Filter products by branchId manually
                const branchFilteredProducts = allProductsNoFilter.filter(product => 
                  product.branch.id === branchId
                );
                console.log('Manually filtered products for branch:', branchFilteredProducts.length);
                
                // Use manually filtered products
                const filteredProducts = branchFilteredProducts;
                
                // Apply search and category filters
                let finalFilteredProducts = filteredProducts;
                
                if (searchQuery) {
                  finalFilteredProducts = finalFilteredProducts.filter((product: any) =>
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.barcode?.includes(searchQuery)
                  );
                }
                
                if (selectedCategory !== "all") {
                  finalFilteredProducts = finalFilteredProducts.filter((product: any) =>
                    product.categoryId === selectedCategory
                  );
                }
                
                // Apply pagination
                const startIndex = (pagination.page - 1) * pagination.limit;
                const endIndex = startIndex + pagination.limit;
                const paginatedProducts = finalFilteredProducts.slice(startIndex, endIndex);
                
                setProducts(paginatedProducts);
                setPagination(prev => ({
                  ...prev,
                  total: finalFilteredProducts.length,
                  pages: Math.ceil(finalFilteredProducts.length / prev.limit)
                }));
                
                console.log('Products updated after creation (manual filter):', paginatedProducts.length);
                return;
              }
            }
            
            // Apply search and category filters
            let filteredProducts = allProducts;
            
            if (searchQuery) {
              filteredProducts = filteredProducts.filter((product: any) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.barcode?.includes(searchQuery)
              );
            }
            
            if (selectedCategory !== "all") {
              filteredProducts = filteredProducts.filter((product: any) =>
                product.categoryId === selectedCategory
              );
            }
            
            // Apply pagination
            const startIndex = (pagination.page - 1) * pagination.limit;
            const endIndex = startIndex + pagination.limit;
            const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
            
            console.log('Setting products after creation:', {
              filteredProducts: filteredProducts.length,
              paginatedProducts: paginatedProducts.length,
              startIndex,
              endIndex,
              currentPage: pagination.page,
              limit: pagination.limit
            });
            
            setProducts(paginatedProducts);
            setPagination(prev => ({
              ...prev,
              total: filteredProducts.length,
              pages: Math.ceil(filteredProducts.length / prev.limit)
            }));
          }
        } catch (error) {
          console.error('Error reloading data after product creation:', error);
          await loadData();
        }
        
        // Force refresh after a short delay to ensure products are visible
        setTimeout(async () => {
          console.log('Force refreshing products after creation...');
          await loadData();
        }, 1000);
        
        // Reset form
        setNewMedicine({
          name: "",
          categoryId: "",
          costPrice: "",
          sellingPrice: "",
          stock: "",
          minStock: "",
          maxStock: "",
          unitsPerPack: "",
          barcode: ""
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewMedicine({
      name: product.name,
      categoryId: product.category.id,
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      maxStock: product.maxStock?.toString() || "",
      unitsPerPack: product.unitsPerPack.toString(),
      barcode: product.barcode || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !newMedicine.name || !newMedicine.categoryId || !newMedicine.sellingPrice || !newMedicine.stock) {
      alert("Please fill all required fields!");
      return;
    }

      try {
        setLoading(true);
      
      const productData = {
        name: newMedicine.name,
        description: "",
        categoryId: newMedicine.categoryId,
        costPrice: parseFloat(newMedicine.costPrice) || 0,
        sellingPrice: parseFloat(newMedicine.sellingPrice),
        stock: parseInt(newMedicine.stock),
        minStock: parseInt(newMedicine.minStock) || 10,
        maxStock: newMedicine.maxStock ? parseInt(newMedicine.maxStock) : null,
        unitType: "tablets", // Default unit type
        unitsPerPack: parseInt(newMedicine.unitsPerPack) || 10,
        barcode: newMedicine.barcode || null,
        requiresPrescription: false // Default to false
      };

      console.log('Updating product with data:', productData);
      
      // Update product via API
      const response = await apiService.updateProduct(editingProduct.id, productData);
        
        if (response.success) {
        console.log('Product updated successfully:', response.data);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('productUpdated', { 
          detail: { product: response.data } 
        }));
        
        // Reload data to get the updated list - fetch products for the current branch
        try {
          const allProductsResponse = await apiService.getProducts({ 
            limit: 1000,
            branchId: user?.branchId 
          });
          if (allProductsResponse.success && allProductsResponse.data) {
            const allProducts = allProductsResponse.data.products;
            
            // Apply search and category filters
            let filteredProducts = allProducts;
            
            if (searchQuery) {
              filteredProducts = filteredProducts.filter((product: any) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.barcode?.includes(searchQuery)
              );
            }
            
            if (selectedCategory !== "all") {
              filteredProducts = filteredProducts.filter((product: any) =>
                product.categoryId === selectedCategory
              );
            }
            
            // Apply pagination
            const startIndex = (pagination.page - 1) * pagination.limit;
            const endIndex = startIndex + pagination.limit;
            const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
            
            setProducts(paginatedProducts);
            setPagination({
              page: pagination.page,
              limit: pagination.limit,
              total: filteredProducts.length,
              pages: Math.ceil(filteredProducts.length / pagination.limit)
            });
          }
        } catch (error) {
          console.error('Error reloading data after product update:', error);
          await loadData();
        }
        
        // Reset form and close dialog
        setEditingProduct(null);
        setNewMedicine({
          name: "",
          categoryId: "",
          costPrice: "",
          sellingPrice: "",
          stock: "",
          minStock: "",
          maxStock: "",
          unitsPerPack: "",
          barcode: ""
        });
        
        setIsEditDialogOpen(false);
        alert("Product updated successfully!");
      } else {
        alert(response.message || "Failed to update product");
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert("Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      setLoading(true);
      const response = await apiService.deleteProduct(deletingProduct.id);
      
      if (response.success) {
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('productDeleted', { 
          detail: { productId: deletingProduct.id } 
        }));
        
        // Reload data to get the updated list - fetch products for the current branch
        try {
          const allProductsResponse = await apiService.getProducts({ 
            limit: 1000,
            branchId: user?.branchId 
          });
          if (allProductsResponse.success && allProductsResponse.data) {
            const allProducts = allProductsResponse.data.products;
            
            // Apply search and category filters
            let filteredProducts = allProducts;
            
            if (searchQuery) {
              filteredProducts = filteredProducts.filter((product: any) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.barcode?.includes(searchQuery)
              );
            }
            
            if (selectedCategory !== "all") {
              filteredProducts = filteredProducts.filter((product: any) =>
                product.categoryId === selectedCategory
              );
            }
            
            // Apply pagination
            const startIndex = (pagination.page - 1) * pagination.limit;
            const endIndex = startIndex + pagination.limit;
            const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
            
            setProducts(paginatedProducts);
            setPagination({
              page: pagination.page,
              limit: pagination.limit,
              total: filteredProducts.length,
              pages: Math.ceil(filteredProducts.length / pagination.limit)
            });
          }
        } catch (error) {
          console.error('Error reloading data after product deletion:', error);
        await loadData();
        }
        
        // Close dialog and reset state
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
        } else {
          alert(response.message || "Failed to delete medicine");
        }
      } catch (error) {
        console.error('Error deleting medicine:', error);
        alert("Failed to delete medicine. Please try again.");
      } finally {
        setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  // Export functionality
  const handleExportInventory = () => {
    try {
      // Create Excel data
      const excelData = products.map(product => ({
        'Product Name': product.name,
        'Category': product.category.name,
        'Supplier': product.supplier.name,
        'Cost Price': product.costPrice,
        'Selling Price': product.sellingPrice,
        'Stock': product.stock,
        'Min Stock': product.minStock,
        'Max Stock': product.maxStock || '',
        'Unit Type': product.unitType,
        'Units Per Pack': product.unitsPerPack,
        'Barcode': product.barcode || '',
        'Requires Prescription': product.requiresPrescription ? 'Yes' : 'No',
        'Description': product.description || ''
      }));

      // Convert to CSV
      const headers = Object.keys(excelData[0]);
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Inventory exported successfully!');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      alert('Error exporting inventory. Please try again.');
    }
  };

  // Import functionality
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please select an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setProcessingImage(true);
    try {
      let extractedData: any[] = [];

      // Check if it's a CSV file
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV content
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          alert('File appears to be empty or invalid.');
          return;
        }

        // Get headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Parse data rows
        console.log('Parsing CSV data...');
        console.log('Headers:', headers);
        console.log('Total lines:', lines.length);
        
        extractedData = lines.slice(1).map((line, index) => {
          console.log(`Processing line ${index + 1}:`, line);
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          console.log(`Split values:`, values);
          const row: any = {};
          
          headers.forEach((header, headerIndex) => {
            const value = values[headerIndex] || '';
            const lowerHeader = header.toLowerCase().trim();
            console.log(`Header "${header}" (${lowerHeader}) -> Value: "${value}"`);
            
            // More flexible header matching
            if (lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader === 'name') {
              row.name = value;
            } else if (lowerHeader.includes('category') || lowerHeader === 'category') {
              row.category = value;
            } else if ((lowerHeader.includes('cost') && lowerHeader.includes('price')) || lowerHeader === 'cost price') {
              row.costPrice = parseFloat(value) || 0;
            } else if ((lowerHeader.includes('selling') && lowerHeader.includes('price')) || lowerHeader === 'selling price') {
              row.sellingPrice = parseFloat(value) || 0;
            } else if ((lowerHeader.includes('stock') && !lowerHeader.includes('min') && !lowerHeader.includes('max')) || lowerHeader === 'stock') {
              row.stock = parseInt(value) || 0;
            } else if ((lowerHeader.includes('unit') && lowerHeader.includes('type')) || lowerHeader === 'unit type') {
              row.unitType = value || 'tablets';
            } else if ((lowerHeader.includes('units') && lowerHeader.includes('pack')) || lowerHeader === 'units per pack') {
              row.unitsPerPack = parseInt(value) || 10;
            } else if (lowerHeader.includes('barcode') || lowerHeader === 'barcode') {
              row.barcode = value;
            } else if (lowerHeader.includes('prescription') || lowerHeader === 'requires prescription') {
              row.requiresPrescription = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value.toLowerCase() === '1';
            } else if (lowerHeader.includes('description') || lowerHeader === 'description') {
              row.description = value;
            }
          });
          
          // Set default values for required fields
          if (!row.unitType) row.unitType = 'tablets';
          if (!row.unitsPerPack) row.unitsPerPack = 10;
          if (!row.costPrice) row.costPrice = 0;
          if (!row.stock) row.stock = 0;
          if (!row.requiresPrescription) row.requiresPrescription = false;
          
          console.log(`Parsed row ${index + 1}:`, row);
          return row;
        }).filter(row => {
          const hasName = !!row.name && row.name.trim() !== '';
          console.log(`Row "${row.name}" has name: ${hasName}`);
          return hasName;
        }); // Only include rows with product names
      } else {
        // For Excel files, show a message to convert to CSV first
        alert('Excel files are not fully supported yet. Please save your Excel file as CSV format and try again.\n\nTo convert:\n1. Open your Excel file\n2. Go to File > Save As\n3. Choose CSV format\n4. Upload the CSV file');
        return;
      }
      
      console.log('Extracted data:', extractedData);
      console.log('Total extracted products:', extractedData.length);

      if (extractedData.length === 0) {
        alert('No valid product data found in the file. Please check that your file has product names in the first column.');
        return;
      }

      console.log('=== FILE PARSING COMPLETE ===');
      console.log('Total products extracted:', extractedData.length);
      console.log('All extracted products:', extractedData);
      
      // Validate extracted data
      const validProducts = extractedData.filter(product => 
        product.name && product.name.trim() !== '' && 
        product.sellingPrice && product.sellingPrice > 0
      );
      
      console.log('Valid products after validation:', validProducts.length);
      
      if (validProducts.length === 0) {
        alert('No valid products found in the file. Please ensure your CSV has:\n- Product names\n- Selling prices\n- Categories (optional, will use default)');
        return;
      }
      
      // Show a simple alert with the count
      alert(`File parsed successfully! Found ${validProducts.length} valid products out of ${extractedData.length} total rows.`);

      setImportedProducts(validProducts);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again or convert Excel to CSV format.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setProcessingImage(true);
    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Simulate OCR processing (in real implementation, you'd call an OCR service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data (replace with actual OCR processing)
      const mockExtractedData = [
        {
          name: 'Paracetamol 500mg',
          category: 'Analgesics',
          costPrice: 2.50,
          sellingPrice: 5.00,
          stock: 100,
          unitType: 'tablets',
          unitsPerPack: 10
        },
        {
          name: 'Amoxicillin 250mg',
          category: 'Antibiotics',
          costPrice: 15.00,
          sellingPrice: 25.00,
          stock: 50,
          unitType: 'capsules',
          unitsPerPack: 20
        },
        {
          name: 'Vitamin C 1000mg',
          category: 'Vitamins',
          costPrice: 8.00,
          sellingPrice: 12.00,
          stock: 75,
          unitType: 'tablets',
          unitsPerPack: 30
        }
      ];

      setImportedProducts(mockExtractedData);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleProceedImport = async () => {
    try {
      setLoading(true);
      
      // Prepare products for bulk import
      const productsToImport = [];
      const createdCategories = [];
      const createdSuppliers = [];
      
      console.log('=== PREPARING PRODUCTS FOR IMPORT ===');
      console.log('Imported products count:', importedProducts.length);
      console.log('Available categories:', categories);
      console.log('Available suppliers:', suppliers);
      
      // Get branchId once for all products
      let branchId = user?.branchId;
      
      // If no branchId from user object, try to get it from localStorage
      if (!branchId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            branchId = parsedUser.branch?.id;
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
      
      // If still no branchId, get the first available branch
      if (!branchId) {
        try {
          const branchesResponse = await apiService.getBranches();
          if (branchesResponse.success && branchesResponse.data?.branches?.length > 0) {
            branchId = branchesResponse.data.branches[0].id;
            console.log('Using first available branch:', branchId);
          } else {
            console.error('No branches available');
            alert('No branches available. Please contact administrator.');
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error fetching branches:', e);
          alert('Error fetching branches. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      console.log('=== BRANCH ID DETERMINED ===');
      console.log('Final branchId for all products:', branchId);
      console.log('BranchId type:', typeof branchId);
      
      for (const productData of importedProducts) {
        console.log(`\n--- Processing product: ${productData.name} ---`);
        console.log('Product data:', productData);
        
        // Find category ID - try exact match first, then partial match
        let category = categories.find(cat => 
          cat.name.toLowerCase() === productData.category.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!category) {
          category = categories.find(cat => 
            cat.name.toLowerCase().includes(productData.category.toLowerCase()) ||
            productData.category.toLowerCase().includes(cat.name.toLowerCase())
          );
        }
        
        // If still no match, try to map common category names
        if (!category) {
          const categoryMappings: { [key: string]: string } = {
            'medicine': 'Analgesics',
            'medicines': 'Analgesics',
            'drugs': 'Analgesics',
            'pharmaceuticals': 'Analgesics',
            'pain': 'Analgesics',
            'pain relief': 'Analgesics',
            'antibiotic': 'Antibiotics',
            'antibiotics': 'Antibiotics',
            'infection': 'Antibiotics',
            'vitamin': 'Vitamins',
            'vitamins': 'Vitamins',
            'supplements': 'Vitamins',
            'stomach': 'Gastric',
            'gastric': 'Gastric',
            'digestive': 'Gastric',
            'cough': 'Cough & Cold',
            'cold': 'Cough & Cold',
            'respiratory': 'Cough & Cold',
            'eye': 'Ophthalmic',
            'ophthalmic': 'Ophthalmic',
            'diabetes': 'Diabetes',
            'diabetic': 'Diabetes'
          };
          
          const mappedCategoryName = categoryMappings[productData.category.toLowerCase()];
          if (mappedCategoryName) {
            category = categories.find(cat => 
              cat.name.toLowerCase() === mappedCategoryName.toLowerCase()
            );
          }
        }
        
        console.log('Found category:', category);
        console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
        
        // If category doesn't exist, use first available category
        if (!category) {
          if (categories.length > 0) {
            category = categories[0];
            console.log(`Using first available category for: ${productData.name}`, category);
          } else {
            console.error(`No categories available for: ${productData.name}`);
            // Try to create a default category
            try {
              console.log('Attempting to create default category...');
              const defaultCategoryResponse = await apiService.createCategory({
                name: 'General Medicine',
                description: 'General medicine category for imports'
              });
              
              if (defaultCategoryResponse.success && defaultCategoryResponse.data) {
                category = defaultCategoryResponse.data;
                console.log('Created default category:', category);
                // Update local categories array
                setCategories(prev => [...prev, category]);
              } else {
                console.error('Failed to create default category');
                continue; // Skip this product
              }
            } catch (error) {
              console.error('Error creating default category:', error);
              continue; // Skip this product
            }
          }
        }

        // Use default supplier ID - no need to create or validate suppliers
        let supplierId = 'default-supplier';
        console.log(`Using default supplier for: ${productData.name}`);
        
        console.log('=== BULK IMPORT DEBUG ===');
        console.log(`Using branchId for product ${productData.name}:`, branchId);
        console.log('User object:', user);
        console.log('User branchId:', user?.branchId);
        console.log('Final branchId:', branchId);
        console.log('BranchId type:', typeof branchId);
        console.log('BranchId length:', branchId?.length);
        
        const productToImport = {
          name: productData.name,
          description: productData.description || "",
          categoryId: category.id,
          supplierId: supplierId, // Will be handled as default-supplier
          branchId: branchId,
          costPrice: productData.costPrice || 0,
          sellingPrice: productData.sellingPrice,
          stock: productData.stock,
          minStock: productData.minStock || 10,
          maxStock: productData.maxStock || null,
          unitType: productData.unitType || "tablets",
          unitsPerPack: productData.unitsPerPack || 10,
          barcode: productData.barcode || null,
          requiresPrescription: productData.requiresPrescription || false,
          isActive: true
        };
        
        productsToImport.push(productToImport);
        console.log(`Added product to import list: ${productData.name}`);
        console.log('Product to import:', productToImport);
      }
      
      console.log(`Total products prepared for import: ${productsToImport.length} out of ${importedProducts.length}`);
      console.log('Products to import:', productsToImport);

      if (productsToImport.length === 0) {
        alert('No valid products to import. Please check that your CSV file has the correct format with product names, categories, and prices.');
        setLoading(false);
        return;
      }

      // Call bulk import API
      console.log('=== CALLING BULK IMPORT API ===');
      console.log('Products to import:', productsToImport);
      console.log('Number of products:', productsToImport.length);
      console.log('API Base URL:', 'http://localhost:5000/api');
      console.log('Token present:', !!localStorage.getItem('token'));
      console.log('User from context:', user);
      
      let response;
      try {
        response = await apiService.bulkImportProducts(productsToImport);
        console.log('=== BULK IMPORT API RESPONSE ===');
        console.log('Response:', response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        
        if (!response.success) {
          console.error('API call failed:', response.message);
          alert(`Import failed: ${response.message}`);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('=== BULK IMPORT API ERROR ===');
        console.error('Error details:', error);
        alert(`Import failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      if (response && response.success) {
        console.log('Bulk import successful, reloading data...');
        console.log('Import response data:', response.data);
        console.log('Successful products:', response.data.successful);
        console.log('Failed products:', response.data.failed);
        
        // Reset filters to show all products
        setSelectedCategory("all");
        setSearchQuery("");
        setPagination(prev => ({ ...prev, page: 1 }));
        
        // Reload data - fetch products for the current branch to ensure imported products are visible
        console.log('About to reload data...');
        console.log('Using branchId for reload:', branchId);
        console.log('BranchId type for reload:', typeof branchId);
        console.log('BranchId length for reload:', branchId?.length);
        
        try {
          const allProductsResponse = await apiService.getProducts({ 
            limit: 1000,
            branchId: branchId 
          });
          console.log('All products response after import:', allProductsResponse);
          
          if (allProductsResponse.success && allProductsResponse.data) {
            const allProducts = allProductsResponse.data.products;
            console.log('Total products after import:', allProducts.length);
            console.log('All products data:', allProducts);
            
            // If no products found with branch filter, try without branch filter
            if (allProducts.length === 0) {
              console.log('No products found with branch filter, trying without branch filter...');
              const allProductsResponseNoFilter = await apiService.getProducts({ 
                limit: 1000
              });
              console.log('All products response (no filter):', allProductsResponseNoFilter);
              
              if (allProductsResponseNoFilter.success && allProductsResponseNoFilter.data) {
                const allProductsNoFilter = allProductsResponseNoFilter.data.products;
                console.log('Total products (no filter):', allProductsNoFilter.length);
                console.log('All products data (no filter):', allProductsNoFilter);
                
                // Filter products by branchId manually
                const branchFilteredProducts = allProductsNoFilter.filter(product => 
                  product.branch.id === branchId
                );
                console.log('Manually filtered products for branch:', branchFilteredProducts.length);
                console.log('Branch IDs in products:', allProductsNoFilter.map(p => ({ name: p.name, branchId: p.branch.id })));
                
                // Use manually filtered products
                const filteredProducts = branchFilteredProducts;
                
                // Apply pagination
                const startIndex = 0; // Start from first page
                const endIndex = 50; // Show first 50 products
                const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
                
                setProducts(paginatedProducts);
                setPagination({
                  page: 1,
                  limit: 50,
                  total: filteredProducts.length,
                  pages: Math.ceil(filteredProducts.length / 50)
                });
                
                console.log('Products updated after import (manual filter):', paginatedProducts.length);
                console.log('Updated products list (manual filter):', paginatedProducts);
              }
            } else {
              // Since we reset filters, show all products without any filtering
              const filteredProducts = allProducts;
              
              // Apply pagination
              const startIndex = 0; // Start from first page
              const endIndex = 50; // Show first 50 products
              const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
              
              setProducts(paginatedProducts);
              setPagination({
                page: 1,
                limit: 50,
                total: filteredProducts.length,
                pages: Math.ceil(filteredProducts.length / 50)
              });
              
              console.log('Products updated after import:', paginatedProducts.length);
              console.log('Updated products list:', paginatedProducts);
            }
          }
        } catch (error) {
          console.error('Error reloading data after import:', error);
          // Fallback to regular loadData
          await loadData();
        }
        console.log('Data reload completed');
        
        // Close dialogs
        setIsPreviewDialogOpen(false);
        setIsImportDialogOpen(false);
        setImportedProducts([]);
        
        // Show results with detailed information
        const { successCount, failureCount } = response.data;
        const updatedCount = response.data.failed.filter((f: any) => f.error.includes('Updated existing product')).length;
        const skippedCount = response.data.failed.filter((f: any) => f.error.includes('already exists') && !f.error.includes('Updated')).length;
        const actualFailureCount = failureCount - updatedCount - skippedCount;
        
        let message = `Import completed!\n\n✅ Added: ${successCount} new products`;
        
        if (updatedCount > 0) {
          message += `\n🔄 Updated: ${updatedCount} existing products (stock added)`;
        }
        
        if (skippedCount > 0) {
          message += `\n⏭️ Skipped: ${skippedCount} existing products`;
        }
        
        if (actualFailureCount > 0) {
          message += `\n❌ Failed: ${actualFailureCount} products`;
          // Show details of failed products
          const failedProducts = response.data.failed;
          if (failedProducts && failedProducts.length > 0) {
            message += `\n\nFailed products:\n`;
            failedProducts.slice(0, 5).forEach((failed: any, index: number) => {
              message += `${index + 1}. ${failed.product.name}: ${failed.error}\n`;
            });
            if (failedProducts.length > 5) {
              message += `... and ${failedProducts.length - 5} more. Check console for details.`;
            }
          }
        }
        
        alert(message);
        
        console.log('Import completed successfully:', {
          total: response.data.total,
          successful: response.data.successCount,
          skipped: skippedCount,
          failed: actualFailureCount,
          successfulProducts: response.data.successful.length
        });
      } else {
        alert(response.message || 'Failed to import products. Please try again.');
      }
    } catch (error) {
      console.error('Error importing products:', error);
      alert('Error importing products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your pharmacy inventory</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <Button onClick={loadData} variant="outline" className="bg-gray-100 hover:bg-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {/* Create Category Dialog */}
          <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Create New Category</span>
                </DialogTitle>
                <DialogDescription>
                  Add a new category to organize your products.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., Pain Relief"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Textarea
                    id="categoryDescription"
                    placeholder="Brief description of the category..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Category
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export/Import Buttons */}
          <div className="flex items-center space-x-2">
            
            
            
            
            
            <Button 
              variant="outline" 
              onClick={handleExportInventory}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <span>Import Products</span>
                  </DialogTitle>
                  <DialogDescription>
                    Choose how you want to import products into your inventory.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Choose Import Method</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Select how you want to import your products
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Excel Sheet Upload */}
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Upload CSV File</h4>
                          <p className="text-sm text-gray-500">Import products from CSV file</p>
                        </div>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                          id="excel-upload"
                        />
                        <Button
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => document.getElementById('excel-upload')?.click()}
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Upload Sheet
                        </Button>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Upload Photo</h4>
                          <p className="text-sm text-gray-500">Take a photo of your product list</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={processingImage}
                        >
                          {processingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Image className="w-4 h-4 mr-2" />
                              Upload Photo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-400">
                      Supported formats: CSV, Images (.png, .jpg, .jpeg)
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Add Medicine Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Add New Medicine</span>
                </DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory with all necessary details.
                </DialogDescription>
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

                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMedicine} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Medicine
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Edit className="w-5 h-5 text-primary" />
                  <span>Edit Product</span>
                </DialogTitle>
                <DialogDescription>
                  Update the product information and save changes to your inventory.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Medicine Name *</Label>
                    <Input
                      id="edit-name"
                      placeholder="e.g., Paracetamol 500mg"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
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
                    <Label htmlFor="edit-unitsPerPack">Units per Pack</Label>
                    <Input
                      id="edit-unitsPerPack"
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
                    <Label htmlFor="edit-costPrice">Cost Price (PKR)</Label>
                    <Input
                      id="edit-costPrice"
                      type="number"
                      placeholder="e.g., 60"
                      value={newMedicine.costPrice}
                      onChange={(e) => setNewMedicine({...newMedicine, costPrice: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-sellingPrice">Selling Price (PKR) *</Label>
                    <Input
                      id="edit-sellingPrice"
                      type="number"
                      placeholder="e.g., 85"
                      value={newMedicine.sellingPrice}
                      onChange={(e) => setNewMedicine({...newMedicine, sellingPrice: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-stock">Current Stock *</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      placeholder="e.g., 150"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({...newMedicine, stock: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-minStock">Minimum Stock Level</Label>
                    <Input
                      id="edit-minStock"
                      type="number"
                      placeholder="e.g., 50"
                      value={newMedicine.minStock}
                      onChange={(e) => setNewMedicine({...newMedicine, minStock: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-maxStock">Maximum Stock Level</Label>
                    <Input
                      id="edit-maxStock"
                      type="number"
                      placeholder="e.g., 200"
                      value={newMedicine.maxStock}
                      onChange={(e) => setNewMedicine({...newMedicine, maxStock: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-barcode">Barcode</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="edit-barcode"
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
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProduct} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span>Confirm Delete</span>
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The product will be permanently removed from your inventory.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Delete Product
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Are you sure you want to delete this product? This action cannot be undone.
                    </p>
                    {deletingProduct && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">
                          {deletingProduct.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Category: {deletingProduct.category.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stock: {deletingProduct.stock} units
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancelDelete}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Confirm Delete
                    </>
                  )}
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
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
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
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
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
              <TrendingUp className="w-8 h-8 text-accent" />
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
              <TrendingDown className="w-8 h-8 text-accent" />
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
                placeholder="Search by name or barcode..."
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
          <CardTitle>Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading products...</span>
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pricing</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stock</th>
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
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">{product.category.name}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <p className="font-medium">PKR {product.sellingPrice}</p>
                            <p className="text-muted-foreground">Cost: PKR {product.costPrice}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{product.stock}</span>
                            <Badge 
                              variant={stockStatus.color === 'destructive' ? 'destructive' : 'default'}
                              className={stockStatus.color === 'warning' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                            >
                              {stockStatus.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Min: {product.minStock} | Max: {product.maxStock || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Edit"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
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

      {/* Import Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span>Preview Imported Products</span>
            </DialogTitle>
            <DialogDescription>
              Review and edit the imported products before adding them to your inventory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Review the extracted product information below. You can edit any fields before proceeding with the import.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Extracted Products ({importedProducts.length})</h3>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Product Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Unit Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Cost Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Selling Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Units/Pack</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Barcode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedProducts.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Input
                              value={product.name}
                              onChange={(e) => {
                                const updated = [...importedProducts];
                                updated[index].name = e.target.value;
                                setImportedProducts(updated);
                              }}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={product.category}
                              onValueChange={(value) => {
                                const updated = [...importedProducts];
                                updated[index].category = value;
                                setImportedProducts(updated);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!categories.find(cat => cat.name.toLowerCase() === product.category.toLowerCase()) && (
                              <p className="text-xs text-blue-600 mt-1">
                                📁 Category "{product.category}" will be auto-created during import.
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={product.unitType}
                              onValueChange={(value) => {
                                const updated = [...importedProducts];
                                updated[index].unitType = value;
                                setImportedProducts(updated);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tablets">Tablets</SelectItem>
                                <SelectItem value="capsules">Capsules</SelectItem>
                                <SelectItem value="syrup">Syrup</SelectItem>
                                <SelectItem value="injection">Injection</SelectItem>
                                <SelectItem value="drops">Drops</SelectItem>
                                <SelectItem value="cream">Cream</SelectItem>
                                <SelectItem value="ointment">Ointment</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              step="0.01"
                              value={product.costPrice}
                              onChange={(e) => {
                                const updated = [...importedProducts];
                                updated[index].costPrice = parseFloat(e.target.value) || 0;
                                setImportedProducts(updated);
                              }}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              step="0.01"
                              value={product.sellingPrice}
                              onChange={(e) => {
                                const updated = [...importedProducts];
                                updated[index].sellingPrice = parseFloat(e.target.value) || 0;
                                setImportedProducts(updated);
                              }}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={product.stock}
                              onChange={(e) => {
                                const updated = [...importedProducts];
                                updated[index].stock = parseInt(e.target.value) || 0;
                                setImportedProducts(updated);
                              }}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={product.unitsPerPack}
                              onChange={(e) => {
                                const updated = [...importedProducts];
                                updated[index].unitsPerPack = parseInt(e.target.value) || 1;
                                setImportedProducts(updated);
                              }}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={product.barcode || ''}
                              onChange={(e) => {
                                const updated = [...importedProducts];
                                updated[index].barcode = e.target.value;
                                setImportedProducts(updated);
                              }}
                              className="w-full"
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPreviewDialogOpen(false);
                  setImportedProducts([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedImport}
                disabled={loading}
                className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Proceed Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;