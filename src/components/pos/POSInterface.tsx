import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Pill,
  Package,
  Droplets,
  Syringe,
  X,
  Printer,
  Download,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import React from "react"; // Added missing import
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
  batch: string;
  expiry: string;
  instructions?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unitType: string;
  unitsPerPack: number;
  category: string;
  requiresPrescription: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: number;
  lastVisit: string;
  loyaltyPoints: number;
  isVIP: boolean;
}

interface Receipt {
  id: string;
  customer: Customer | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  date: string;
  time: string;
  cashier: string;
  receiptNumber: string;
}

const POSInterface = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });
  const [invoiceItems, setInvoiceItems] = useState<CartItem[]>([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceSelectedCategory, setInvoiceSelectedCategory] = useState("all");

  // Load selected customer from localStorage if coming from Customer Management
  React.useEffect(() => {
    const savedCustomer = localStorage.getItem('selectedCustomer');
    if (savedCustomer) {
      try {
        const customer = JSON.parse(savedCustomer);
        setSelectedCustomer(customer);
        localStorage.removeItem('selectedCustomer'); // Clear after loading
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    }
  }, []);

  // Load products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Load all products from database (increased limit to 1000)
      const response = await apiService.getProducts({ limit: 1000 });
      console.log('Products API response:', response);
      if (response.success && response.data) {
        // Transform API data to match Product interface
        const transformedProducts = response.data.products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.sellingPrice,
          stock: product.stock,
          unitType: product.unitType,
          unitsPerPack: product.unitsPerPack,
          category: product.category.name,
          requiresPrescription: product.requiresPrescription
        }));
        console.log('Transformed products:', transformedProducts);
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample customers
  const customers: Customer[] = [
    {
      id: "1",
      name: "Ahmad Khan",
      phone: "+92 300 1234567",
      email: "ahmad.khan@email.com",
      address: "Block A, Gulberg, Lahore",
      totalPurchases: 45230,
      lastVisit: "2024-01-15",
      loyaltyPoints: 1250,
      isVIP: true
    },
    {
      id: "2",
      name: "Fatima Ali",
      phone: "+92 301 2345678",
      email: "fatima.ali@email.com",
      address: "DHA Phase 5, Karachi",
      totalPurchases: 32100,
      lastVisit: "2024-01-14",
      loyaltyPoints: 890,
      isVIP: true
    },
    {
      id: "3",
      name: "Hassan Sheikh",
      phone: "+92 302 3456789",
      email: "hassan.sheikh@email.com",
      address: "F-8, Islamabad",
      totalPurchases: 18900,
      lastVisit: "2024-01-13",
      loyaltyPoints: 420,
      isVIP: false
    }
  ];

  const categories = ["all", "Analgesics", "Antibiotics", "Vitamins", "Gastric", "Cough & Cold", "Ophthalmic", "Diabetes"];

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

  const addToCart = (product: Product, quantity: number, unitType: string) => {
    const existingItem = cart.find(item =>
      item.name === product.name && item.unitType === unitType
    );

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const unitPrice = unitType === "pack" ? product.price : product.price / product.unitsPerPack;
      const totalPrice = unitPrice * quantity;

      setCart([...cart, {
        id: product.id, // Use actual product ID from database
        name: product.name,
        price: product.price,
        quantity: quantity,
        unitType: unitType,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        batch: "BT" + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        expiry: "Dec 2025",
        instructions: unitType === "pack" ? "Take as directed" : `Take ${quantity} ${unitType} as directed`
      }]);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        } : item
      ));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.17; // 17% GST
  const total = subtotal + tax;

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'mobile', label: 'Mobile', icon: Smartphone }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredInvoiceProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
    const matchesCategory = invoiceSelectedCategory === "all" || product.category === invoiceSelectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCashPayment = () => {
    const cash = parseFloat(cashAmount);
    if (cash >= total) {
      setChangeAmount(cash - total);
      setPaymentStatus('completed');
    } else {
      alert("Cash amount must be greater than or equal to total amount!");
    }
  };

  const handleCardPayment = () => {
    setPaymentStatus('processing');
    // Simulate card payment processing
    setTimeout(() => {
      setPaymentStatus('completed');
    }, 2000);
  };

  const handleMobilePayment = () => {
    setPaymentStatus('processing');
    // Simulate mobile payment processing
    setTimeout(() => {
      setPaymentStatus('completed');
    }, 2000);
  };

  const processPayment = () => {
    if (selectedPayment === 'cash') {
      handleCashPayment();
    } else if (selectedPayment === 'card') {
      handleCardPayment();
    } else if (selectedPayment === 'mobile') {
      handleMobilePayment();
    }
  };

  const generateReceipt = () => {
    const now = new Date();
    const receipt: Receipt = {
      id: String(Date.now()),
      customer: selectedCustomer,
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod: selectedPayment,
      paymentStatus: paymentStatus === 'completed' ? 'Paid' : 'Pending',
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      cashier: "Dr. Ahmed Khan",
      receiptNumber: `RCP-${String(now.getFullYear())}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    };

    setCurrentReceipt(receipt);
    setIsReceiptDialogOpen(true);

    // Reset cart and form
    setCart([]);
    setSelectedCustomer(null);
    setCashAmount("");
    setChangeAmount(0);
    setPaymentStatus('pending');
  };

  const addNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert("Please enter customer name and phone number!");
      return;
    }

    const customer: Customer = {
      id: String(Date.now()),
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || "",
      address: newCustomer.address || "",
      totalPurchases: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
      isVIP: false
    };

    // Add to customers list
    customers.push(customer);

    // Set as selected customer
    setSelectedCustomer(customer);

    // Reset form and close dialog
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: ""
    });
    setIsNewCustomerDialogOpen(false);
  };

  const addToInvoiceCart = (product: Product, quantity: number, unitType: string) => {
    console.log('Adding product to invoice cart:', product);
    const existingItem = invoiceItems.find(item =>
      item.name === product.name && item.unitType === unitType
    );

    if (existingItem) {
      updateInvoiceQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const unitPrice = unitType === "pack" ? product.price : product.price / product.unitsPerPack;
      const totalPrice = unitPrice * quantity;

      const newItem = {
        id: product.id, // Use actual product ID from database
        name: product.name,
        price: product.price,
        quantity: quantity,
        unitType: unitType,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        batch: "BT" + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        expiry: "Dec 2025",
        instructions: unitType === "pack" ? "Take as directed" : `Take ${quantity} ${unitType} as directed`
      };
      console.log('New invoice item:', newItem);
      setInvoiceItems([...invoiceItems, newItem]);
    }
  };

  const updateInvoiceQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    } else {
      setInvoiceItems(invoiceItems.map(item =>
        item.id === id ? {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        } : item
      ));
    }
  };

  const createInvoice = async () => {
    if (!invoiceCustomer.name || !invoiceCustomer.phone) {
      alert("Please enter customer name and phone number!");
      return;
    }

    if (invoiceItems.length === 0) {
      alert("Please add at least one item to the invoice!");
      return;
    }

    try {
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

      // Create customer in backend or find existing customer
      let customerId = null;
      try {
        // First try to find existing customer by phone
        const existingCustomersResponse = await apiService.getCustomers({
          search: invoiceCustomer.phone,
          branchId: branchId
        });

        if (existingCustomersResponse.success && existingCustomersResponse.data?.customers?.length > 0) {
          // Use existing customer
          const existingCustomer = existingCustomersResponse.data.customers.find(
            c => c.phone === invoiceCustomer.phone
          );
          if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log('Using existing customer:', existingCustomer);
          }
        }

        // If no existing customer found, create new one
        if (!customerId) {
          const customerResponse = await apiService.createCustomer({
            name: invoiceCustomer.name,
            phone: invoiceCustomer.phone,
            email: invoiceCustomer.email || "",
            address: invoiceCustomer.address || "",
            branchId: branchId
          });

          if (customerResponse.success && customerResponse.data) {
            customerId = customerResponse.data.id;
            console.log('Created new customer:', customerResponse.data);
          } else {
            console.warn('Customer creation failed:', customerResponse.message);
            // Try to find customer again in case it was created by another process
            const retryResponse = await apiService.getCustomers({
              search: invoiceCustomer.phone,
              branchId: branchId
            });
            if (retryResponse.success && retryResponse.data?.customers?.length > 0) {
              const retryCustomer = retryResponse.data.customers.find(
                c => c.phone === invoiceCustomer.phone
              );
              if (retryCustomer) {
                customerId = retryCustomer.id;
                console.log('Found customer on retry:', retryCustomer);
              }
            }
          }
        }
      } catch (customerError) {
        console.error('Error handling customer:', customerError);
        // Continue with invoice creation even if customer handling fails
      }

      // Create sale in backend
      const saleData = {
        customerId: customerId,
        branchId: branchId,
        items: invoiceItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batch,
          expiryDate: item.expiry
        })),
        paymentMethod: 'CASH' as const,
        discountAmount: 0
      };

      const saleResponse = await apiService.createSale(saleData);

      if (saleResponse.success && saleResponse.data) {
        // Create receipt from sale response
        const sale = saleResponse.data;
        console.log('Sale response data:', sale);
        console.log('Customer data in sale:', sale.customer);
        const receipt: Receipt = {
          id: sale.id,
          customer: sale.customer ? {
            id: sale.customer.id,
            name: sale.customer.name,
            phone: sale.customer.phone,
            email: sale.customer.email || "",
            address: sale.customer.address || "",
            totalPurchases: sale.customer.totalPurchases || 0,
            lastVisit: sale.customer.lastVisit ? new Date(sale.customer.lastVisit).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            loyaltyPoints: sale.customer.loyaltyPoints || 0,
            isVIP: sale.customer.isVIP || false
          } : null,
          items: sale.items.map(item => ({
            id: item.id,
            name: item.product.name,
            price: item.unitPrice,
            quantity: item.quantity,
            unitType: item.product.unitType,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            batch: item.batchNumber || "",
            expiry: item.expiryDate || "",
            instructions: ""
          })),
          subtotal: sale.subtotal,
          tax: sale.taxAmount,
          total: sale.totalAmount,
          paymentMethod: sale.paymentMethod.toLowerCase(),
          paymentStatus: sale.paymentStatus,
          date: new Date(sale.createdAt).toLocaleDateString(),
          time: new Date(sale.createdAt).toLocaleTimeString(),
          cashier: user?.name || "Cashier",
          receiptNumber: sale.receiptNumber
        };

        setCurrentReceipt(receipt);
        setIsReceiptDialogOpen(true);
        setIsInvoiceDialogOpen(false);

        // Reset invoice form
        setInvoiceCustomer({
          name: "",
          phone: "",
          email: "",
          address: ""
        });
        setInvoiceItems([]);
        setInvoiceSearchQuery("");
        setInvoiceSelectedCategory("all");

        // Reload products to update stock
        await loadProducts();

        // Notify customer management page to refresh
        window.dispatchEvent(new CustomEvent('customerCreated', { 
          detail: { customerId: customerId } 
        }));
      } else {
        console.error('Sale creation failed:', saleResponse.message);
        alert(`Error creating sale: ${saleResponse.message || 'Please try again.'}`);
      }

    } catch (error) {
      console.error('Error creating invoice:', error);
      alert("Error creating invoice. Please try again.");
    }
  };

  const printReceipt = () => {
    if (!currentReceipt) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pharmacy Receipt - ${currentReceipt.receiptNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 {
              font-size: 18px;
              margin: 0;
              font-weight: bold;
            }
            .header p {
              font-size: 10px;
              margin: 5px 0;
            }
            .receipt-info {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin-bottom: 15px;
            }
            .customer-info {
              border: 1px solid #000;
              padding: 8px;
              margin-bottom: 15px;
              font-size: 10px;
            }
            .customer-info h3 {
              margin: 0 0 5px 0;
              font-size: 11px;
              font-weight: bold;
            }
            .items {
              margin-bottom: 15px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px dotted #ccc;
            }
            .item-name {
              flex: 1;
              font-weight: bold;
            }
            .item-details {
              font-size: 9px;
              color: #666;
            }
            .item-price {
              font-weight: bold;
            }
            .totals {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 15px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
            }
            .total-final {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .payment-info {
              border: 1px solid #000;
              padding: 8px;
              margin: 15px 0;
              font-size: 10px;
            }
            .footer {
              text-align: center;
              font-size: 9px;
              margin-top: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .receipt { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>MediBill Pulse Pharmacy</h1>
              <p>Your Health, Our Priority</p>
            </div>
            
            <div class="receipt-info">
              <div>
                <strong>Receipt:</strong> ${currentReceipt.receiptNumber}<br>
                <strong>Date:</strong> ${currentReceipt.date}
              </div>
              <div>
                <strong>Time:</strong> ${currentReceipt.time}<br>
                <strong>Cashier:</strong> ${currentReceipt.cashier}
              </div>
            </div>

            ${currentReceipt.customer ? `
            <div class="customer-info">
              <h3>Customer Information</h3>
              <strong>Name:</strong> ${currentReceipt.customer.name}<br>
              <strong>Phone:</strong> ${currentReceipt.customer.phone}<br>
              ${currentReceipt.customer.email ? `<strong>Email:</strong> ${currentReceipt.customer.email}<br>` : ''}
              ${currentReceipt.customer.address ? `<strong>Address:</strong> ${currentReceipt.customer.address}` : ''}
            </div>
            ` : ''}

            <div class="items">
              <h3>Items Purchased:</h3>
              ${currentReceipt.items.map(item => `
                <div class="item">
                  <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">${item.quantity} ${item.unitType} × PKR ${item.unitPrice.toFixed(2)}</div>
                    ${item.instructions ? `<div class="item-details">${item.instructions}</div>` : ''}
                  </div>
                  <div class="item-price">PKR ${item.totalPrice.toFixed(2)}</div>
                </div>
              `).join('')}
            </div>

            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>PKR ${currentReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>GST (17%):</span>
                <span>PKR ${currentReceipt.tax.toFixed(2)}</span>
              </div>
              <div class="total-line total-final">
                <span>TOTAL:</span>
                <span>PKR ${currentReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-info">
              <strong>Payment Method:</strong> ${currentReceipt.paymentMethod.toUpperCase()}<br>
              <strong>Status:</strong> ${currentReceipt.paymentStatus}
              ${selectedPayment === 'cash' && changeAmount > 0 ? `
                <br><strong>Cash Received:</strong> PKR ${parseFloat(cashAmount).toFixed(2)}
                <br><strong>Change:</strong> PKR ${changeAmount.toFixed(2)}
              ` : ''}
            </div>

            <div class="footer">
              <p>Thank you for choosing MediBill Pulse Pharmacy!</p>
              <p>Please keep this receipt for your records</p>
              <p><strong>Important:</strong> Follow dosage instructions carefully.<br>
              Consult your doctor if you have any questions.</p>
            </div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const downloadReceipt = () => {
    // Implementation for downloading receipt as PDF
    alert("Receipt download functionality will be implemented here");
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

        {/* Product Search & Selection */}
        <Card className="lg:col-span-2 shadow-soft border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-primary" />
              <span>Pharmacy Product Search</span>
            </CardTitle>
              <Button
                onClick={() => setIsInvoiceDialogOpen(true)}
                className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Create Invoice for New Customer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by medicine name, barcode, or batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button size="lg" variant="outline" className="px-4">
                <Scan className="w-5 h-5" />
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`capitalize ${selectedCategory === category
                      ? "text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)]"
                      : ""
                    }`}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cursor-pointer hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">{product.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            {getUnitIcon(product.unitType)}
                            <span className="text-xs text-muted-foreground capitalize">
                              {product.unitType} • {product.unitsPerPack} per pack
                            </span>
                          </div>
                        </div>
                        {product.requiresPrescription && (
                          <Badge variant="secondary" className="text-xs">Rx Required</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">PKR {product.price}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.stock} left
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {/* Pack Quantity Input */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Add Packs</Label>
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="flex-1 h-8 text-sm"
                              id={`pack-${product.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-3"
                              onClick={() => {
                                const input = document.getElementById(`pack-${product.id}`) as HTMLInputElement;
                                const quantity = parseInt(input.value) || 0;
                                if (quantity > 0) {
                                  addToCart(product, quantity, "pack");
                                  input.value = "";
                                }
                              }}
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Add Pack
                            </Button>
                          </div>
                        </div>

                        {/* Individual Unit Quantity Input */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Add Individual {product.unitType}</Label>
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="flex-1 h-8 text-sm"
                              id={`unit-${product.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-3"
                              onClick={() => {
                                const input = document.getElementById(`unit-${product.id}`) as HTMLInputElement;
                                const quantity = parseInt(input.value) || 0;
                                if (quantity > 0) {
                                  addToCart(product, quantity, product.unitType);
                                  input.value = "";
                                }
                              }}
                            >
                              {getUnitIcon(product.unitType)}
                              <span className="ml-1">Add</span>
                            </Button>
                          </div>
                        </div>

                        {/* Quick Add Buttons */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Quick Add</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => addToCart(product, 1, "pack")}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              1 Pack
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => addToCart(product, 1, product.unitType)}
                            >
                              {getUnitIcon(product.unitType)}
                              <span className="ml-1">1 {product.unitType.slice(0, -1)}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

       
      </div>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pharmacy Receipt</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={printReceipt}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={downloadReceipt}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {currentReceipt && (
            <div className="space-y-6 print:p-6">
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-primary">MediBill Pulse Pharmacy</h2>
                <p className="text-muted-foreground">Your Health, Our Priority</p>
                <div className="flex justify-between text-sm mt-4">
                  <div>
                    <p><strong>Receipt:</strong> {currentReceipt.receiptNumber}</p>
                    <p><strong>Date:</strong> {currentReceipt.date}</p>
                  </div>
                  <div>
                    <p><strong>Time:</strong> {currentReceipt.time}</p>
                    <p><strong>Cashier:</strong> {currentReceipt.cashier}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {currentReceipt.customer && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Name:</strong> {currentReceipt.customer.name}</p>
                      <p><strong>Phone:</strong> {currentReceipt.customer.phone}</p>
                    </div>
                    <div>
                      <p><strong>Email:</strong> {currentReceipt.customer.email}</p>
                      <p><strong>Address:</strong> {currentReceipt.customer.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Items Purchased</h3>
                {currentReceipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unitType} × PKR {item.unitPrice.toFixed(2)}
                      </p>
                      {item.instructions && (
                        <p className="text-xs text-blue-600 mt-1">{item.instructions}</p>
                      )}
                    </div>
                    <p className="font-semibold">PKR {item.totalPrice.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {currentReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (17%):</span>
                  <span>PKR {currentReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">PKR {currentReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Payment Method:</strong> {currentReceipt.paymentMethod.toUpperCase()}</p>
                    <p><strong>Status:</strong> {currentReceipt.paymentStatus}</p>
                  </div>
                  {selectedPayment === 'cash' && changeAmount > 0 && (
                    <div>
                      <p><strong>Cash Received:</strong> PKR {parseFloat(cashAmount).toFixed(2)}</p>
                      <p><strong>Change:</strong> PKR {changeAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                <p>Thank you for choosing MediBill Pulse Pharmacy!</p>
                <p>Please keep this receipt for your records</p>
                <p className="mt-2">
                  <strong>Important:</strong> Follow dosage instructions carefully.
                  Consult your doctor if you have any questions.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Add New Customer</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                placeholder="Enter phone number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="Enter email address"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address (Optional)</Label>
              <Input
                id="customerAddress"
                placeholder="Enter address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setIsNewCustomerDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={addNewCustomer}
              className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Creation Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-primary" />
              <span>Create Invoice for New Customer</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Details Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="invoiceCustomerName">Customer Name *</Label>
                  <Input
                    id="invoiceCustomerName"
                    placeholder="Enter customer name"
                    value={invoiceCustomer.name}
                    onChange={(e) => setInvoiceCustomer({ ...invoiceCustomer, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceCustomerPhone">Phone Number *</Label>
                  <Input
                    id="invoiceCustomerPhone"
                    placeholder="Enter phone number"
                    value={invoiceCustomer.phone}
                    onChange={(e) => setInvoiceCustomer({ ...invoiceCustomer, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceCustomerEmail">Email (Optional)</Label>
                  <Input
                    id="invoiceCustomerEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={invoiceCustomer.email}
                    onChange={(e) => setInvoiceCustomer({ ...invoiceCustomer, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceCustomerAddress">Address (Optional)</Label>
                  <Input
                    id="invoiceCustomerAddress"
                    placeholder="Enter address"
                    value={invoiceCustomer.address}
                    onChange={(e) => setInvoiceCustomer({ ...invoiceCustomer, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Medicine Search */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Medicines</h3>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by medicine name..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={invoiceSelectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInvoiceSelectedCategory(category)}
                      className={`capitalize ${invoiceSelectedCategory === category
                          ? "text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)]"
                          : ""
                        }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                {/* Products List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredInvoiceProducts.map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            {getUnitIcon(product.unitType)}
                            <span className="text-xs text-muted-foreground capitalize">
                              {product.unitType} • {product.unitsPerPack} per pack
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">PKR {product.price}</span>
                      </div>

                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="flex-1 h-8 text-sm"
                          id={`invoice-pack-${product.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3"
                          onClick={() => {
                            const input = document.getElementById(`invoice-pack-${product.id}`) as HTMLInputElement;
                            const quantity = parseInt(input.value) || 0;
                            if (quantity > 0) {
                              addToInvoiceCart(product, quantity, "pack");
                              input.value = "";
                            }
                          }}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Add Pack
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3"
                          onClick={() => {
                            const input = document.getElementById(`invoice-pack-${product.id}`) as HTMLInputElement;
                            const quantity = parseInt(input.value) || 0;
                            if (quantity > 0) {
                              addToInvoiceCart(product, quantity, product.unitType);
                              input.value = "";
                            }
                          }}
                        >
                          {getUnitIcon(product.unitType)}
                          <span className="ml-1">Add</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Items & Totals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selected Items</h3>
              
              {/* Selected Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {invoiceItems.map((item) => (
                  <div key={item.id} className="p-3 bg-gradient-surface rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {getUnitIcon(item.unitType)}
                          <span className="text-xs text-muted-foreground">
                            {item.quantity} {item.unitType} • PKR {item.unitPrice.toFixed(2)} each
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Batch: {item.batch} • Exp: {item.expiry}
                        </p>
                        {item.instructions && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            💊 {item.instructions}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateInvoiceQuantity(item.id, 0)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateInvoiceQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateInvoiceQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">PKR {item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {invoiceItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No items selected</p>
                    <p className="text-xs">Search and add medicines to create invoice</p>
                  </div>
                )}
              </div>

              {/* Totals */}
              {invoiceItems.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">PKR {invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (17%)</span>
                    <span className="font-medium">PKR {(invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.17).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">PKR {(invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0) * 1.17).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsInvoiceDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={createInvoice}
                  className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90"
                  disabled={invoiceItems.length === 0}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Create Invoice & Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSInterface;