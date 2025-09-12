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
  AlertCircle,
  RefreshCw
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
  barcode?: string;
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

interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  validUntil?: string;
  isActive: boolean;
}

interface SplitPayment {
  id: string;
  method: 'cash' | 'card' | 'mobile' | 'gift_card';
  amount: number;
  reference?: string;
}

interface RefundItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

interface GiftCard {
  id: string;
  number: string;
  balance: number;
  isActive: boolean;
  expiryDate?: string;
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
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [appliedPromotions, setAppliedPromotions] = useState<Promotion[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReceiptNumber, setRefundReceiptNumber] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [giftCardAmount, setGiftCardAmount] = useState(0);
  const [foundInvoice, setFoundInvoice] = useState<any>(null);
  const [invoiceLookupLoading, setInvoiceLookupLoading] = useState(false);

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
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadProducts();
    loadCategories();
    
    // Listen for product updates
    const handleProductUpdate = () => {
      loadProducts();
    };
    
    window.addEventListener('productCreated', handleProductUpdate);
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productDeleted', handleProductUpdate);
    
    return () => {
      window.removeEventListener('productCreated', handleProductUpdate);
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productDeleted', handleProductUpdate);
    };
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
          requiresPrescription: product.requiresPrescription,
          barcode: product.barcode
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

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success) {
        // Extract category names and add "all" option
        const categoryNames = response.data.categories.map((cat: any) => cat.name);
        setCategories(["all", ...categoryNames]);
      } else {
        console.error('Failed to load categories:', response.message);
        setCategories(["all"]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(["all"]);
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
  const total = subtotal + tax - discountAmount;

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'gift_card', label: 'Gift Card', icon: CreditCard }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredInvoiceProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
    return matchesSearch;
  });

  // Barcode scanning functionality
  const handleBarcodeScan = async () => {
    setIsScanning(true);
    try {
      // Check if browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access not supported in this browser');
        return;
      }

      // For now, we'll use a simple prompt for barcode input
      // In a real implementation, you would integrate with a barcode scanning library
      const barcode = prompt('Enter barcode or scan QR code:');
      if (barcode) {
        setScannedBarcode(barcode);
        await searchProductByBarcode(barcode);
      }
    } catch (error) {
      console.error('Barcode scanning error:', error);
      alert('Error accessing camera for barcode scanning');
    } finally {
      setIsScanning(false);
    }
  };

  const searchProductByBarcode = async (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      // Auto-add to cart
      addToCart(product, 1, "pack");
      setSearchQuery(product.name); // Update search to show the found product
    } else {
      alert(`Product with barcode ${barcode} not found`);
    }
  };

  // Sample promotions data
  const availablePromotions: Promotion[] = [
    {
      id: "1",
      code: "WELCOME10",
      name: "Welcome Discount",
      type: "percentage",
      value: 10,
      minAmount: 1000,
      maxDiscount: 500,
      validUntil: "2024-12-31",
      isActive: true
    },
    {
      id: "2",
      code: "SAVE50",
      name: "Fixed Discount",
      type: "fixed",
      value: 50,
      minAmount: 200,
      validUntil: "2024-12-31",
      isActive: true
    },
    {
      id: "3",
      code: "VIP20",
      name: "VIP Customer Discount",
      type: "percentage",
      value: 20,
      minAmount: 500,
      maxDiscount: 1000,
      validUntil: "2024-12-31",
      isActive: true
    }
  ];

  const applyPromotion = () => {
    if (!promoCode.trim()) {
      alert("Please enter a promotion code");
      return;
    }

    const promotion = availablePromotions.find(p => 
      p.code.toLowerCase() === promoCode.toLowerCase() && p.isActive
    );

    if (!promotion) {
      alert("Invalid or expired promotion code");
      return;
    }

    // Check if promotion is already applied
    if (appliedPromotions.find(p => p.id === promotion.id)) {
      alert("This promotion has already been applied");
      return;
    }

    // Check minimum amount requirement
    if (promotion.minAmount && subtotal < promotion.minAmount) {
      alert(`Minimum purchase amount of PKR ${promotion.minAmount} required for this promotion`);
      return;
    }

    // Check validity
    if (promotion.validUntil && new Date(promotion.validUntil) < new Date()) {
      alert("This promotion has expired");
      return;
    }

    // Calculate discount
    let discount = 0;
    if (promotion.type === 'percentage') {
      discount = (subtotal * promotion.value) / 100;
      if (promotion.maxDiscount) {
        discount = Math.min(discount, promotion.maxDiscount);
      }
    } else {
      discount = promotion.value;
    }

    // Apply discount
    setAppliedPromotions([...appliedPromotions, promotion]);
    setDiscountAmount(discountAmount + discount);
    setPromoCode("");
    alert(`Promotion "${promotion.name}" applied! Discount: PKR ${discount.toFixed(2)}`);
  };

  const removePromotion = (promotionId: string) => {
    const promotion = appliedPromotions.find(p => p.id === promotionId);
    if (promotion) {
      let discount = 0;
      if (promotion.type === 'percentage') {
        discount = (subtotal * promotion.value) / 100;
        if (promotion.maxDiscount) {
          discount = Math.min(discount, promotion.maxDiscount);
        }
      } else {
        discount = promotion.value;
      }
      
      setAppliedPromotions(appliedPromotions.filter(p => p.id !== promotionId));
      setDiscountAmount(Math.max(0, discountAmount - discount));
    }
  };

  // Split payment functionality
  const addSplitPayment = (method: 'cash' | 'card' | 'mobile' | 'gift_card', amount: number, reference?: string) => {
    const newPayment: SplitPayment = {
      id: String(Date.now()),
      method,
      amount,
      reference
    };
    setSplitPayments([...splitPayments, newPayment]);
  };

  const removeSplitPayment = (paymentId: string) => {
    setSplitPayments(splitPayments.filter(p => p.id !== paymentId));
  };

  const getTotalSplitAmount = () => {
    return splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingAmount = () => {
    return total - getTotalSplitAmount();
  };

  const isSplitPaymentComplete = () => {
    return Math.abs(getRemainingAmount()) < 0.01; // Allow for small floating point differences
  };

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
      // First, create or find customer
      let customerId = null;
      try {
        const customerResponse = await apiService.createCustomer({
          name: invoiceCustomer.name,
          phone: invoiceCustomer.phone,
          email: invoiceCustomer.email || "",
          address: invoiceCustomer.address || "",
          branchId: (user as any)?.branchId || "branch_001"
        });
        
        if (customerResponse.success) {
          customerId = customerResponse.data.id;
        }
      } catch (error) {
        console.log('Customer creation failed, proceeding without customer ID');
      }

      // Prepare sale data for API
      const saleData = {
        customerId: customerId,
        branchId: (user as any)?.branchId || "branch_001",
        items: invoiceItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batch || "",
          expiryDate: item.expiry || ""
        })),
        paymentMethod: 'CASH' as const,
        discountAmount: discountAmount
      };

      console.log('Creating sale with data:', saleData);

      // Create sale via API (this will reduce stock in database)
      const saleResponse = await apiService.createSale(saleData);
      
      if (!saleResponse.success) {
        alert(saleResponse.message || "Failed to create invoice. Please try again.");
        return;
      }

      const sale = saleResponse.data;
      console.log('Sale created successfully:', sale);

      // Create receipt for display
      const receipt: Receipt = {
        id: sale.id,
        customer: {
          id: customerId || "",
          name: invoiceCustomer.name,
          phone: invoiceCustomer.phone,
          email: invoiceCustomer.email || "",
          address: invoiceCustomer.address || "",
          totalPurchases: sale.totalAmount,
          loyaltyPoints: Math.floor(sale.totalAmount / 100),
          isVIP: false,
          lastVisit: new Date().toISOString().split('T')[0]
        },
        items: invoiceItems,
        subtotal: sale.subtotal,
        tax: sale.taxAmount,
        total: sale.totalAmount,
        paymentMethod: 'cash',
        paymentStatus: 'Paid',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: user?.name || "Cashier",
        receiptNumber: sale.receiptNumber
      };

      // Store the invoice in localStorage for the Invoices tab
      const existingInvoices = JSON.parse(localStorage.getItem('mockInvoices') || '[]');
      existingInvoices.unshift(sale);
      localStorage.setItem('mockInvoices', JSON.stringify(existingInvoices));

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
      setAppliedPromotions([]);
      setPromoCode("");
      setDiscountAmount(0);

      // Reload products to update stock (this will show the reduced quantities)
      await loadProducts();

      // Notify other components about new invoice
      window.dispatchEvent(new CustomEvent('invoiceCreated', { 
        detail: { invoice: sale } 
      }));

      alert(`Invoice created successfully!\n\nInvoice Number: ${sale.id}\nReceipt Number: ${sale.receiptNumber}\nTotal Amount: PKR ${sale.totalAmount.toFixed(2)}`);

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

  const sendSMSReceipt = async () => {
    if (!currentReceipt?.customer?.phone) {
      alert("Customer phone number is required to send SMS receipt");
      return;
    }

    try {
      // In a real implementation, you would call an SMS API service
      const smsMessage = `Thank you for your purchase at MediBill Pulse Pharmacy!
Receipt: ${currentReceipt.receiptNumber}
Total: PKR ${currentReceipt.total.toFixed(2)}
Date: ${currentReceipt.date} ${currentReceipt.time}

Items:
${currentReceipt.items.map(item => `• ${item.name} - ${item.quantity} ${item.unitType} - PKR ${item.totalPrice.toFixed(2)}`).join('\n')}

Thank you for choosing us!`;

      // Simulate SMS sending
      alert(`SMS receipt sent to ${currentReceipt.customer.phone}:\n\n${smsMessage}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Error sending SMS receipt. Please try again.');
    }
  };

  const sendEmailReceipt = async () => {
    if (!currentReceipt?.customer?.email) {
      alert("Customer email address is required to send email receipt");
      return;
    }

    try {
      // In a real implementation, you would call an email API service
      const emailSubject = `Receipt from MediBill Pulse Pharmacy - ${currentReceipt.receiptNumber}`;
      
      const emailBody = `
Dear ${currentReceipt.customer.name},

Thank you for your purchase at MediBill Pulse Pharmacy!

Receipt Details:
- Receipt Number: ${currentReceipt.receiptNumber}
- Date: ${currentReceipt.date}
- Time: ${currentReceipt.time}
- Cashier: ${currentReceipt.cashier}

Items Purchased:
${currentReceipt.items.map(item => `
• ${item.name}
  Quantity: ${item.quantity} ${item.unitType}
  Unit Price: PKR ${item.unitPrice.toFixed(2)}
  Total: PKR ${item.totalPrice.toFixed(2)}
`).join('')}

Summary:
- Subtotal: PKR ${currentReceipt.subtotal.toFixed(2)}
- GST (17%): PKR ${currentReceipt.tax.toFixed(2)}
- Total: PKR ${currentReceipt.total.toFixed(2)}
- Payment Method: ${currentReceipt.paymentMethod.toUpperCase()}

Please keep this receipt for your records.

Important: Follow dosage instructions carefully. Consult your doctor if you have any questions.

Thank you for choosing MediBill Pulse Pharmacy!
Your Health, Our Priority

Best regards,
MediBill Pulse Pharmacy Team
      `;

      // Simulate email sending
      alert(`Email receipt sent to ${currentReceipt.customer.email}:\n\nSubject: ${emailSubject}\n\n${emailBody}`);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email receipt. Please try again.');
    }
  };

  // Mock invoice data for testing
  const mockInvoices = [
    {
      id: "sale_001",
      customerId: "cust_001",
      userId: "user_001",
      branchId: "branch_001",
      subtotal: 1500.00,
      taxAmount: 255.00,
      discountAmount: 0,
      totalAmount: 1755.00,
      paymentMethod: "CASH",
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
      createdAt: "2024-01-15T10:30:00Z",
      customer: {
        id: "cust_001",
        name: "Ahmad Khan",
        phone: "+92 300 1234567",
        email: "ahmad.khan@email.com",
        address: "Block A, Gulberg, Lahore"
      },
      user: {
        id: "user_001",
        name: "Dr. Ahmed Khan",
        username: "ahmed.khan"
      },
      branch: {
        id: "branch_001",
        name: "Main Branch",
        address: "123 Main Street, Lahore"
      },
      items: [
        {
          id: "item_001",
          productId: "prod_001",
          quantity: 2,
          unitPrice: 500.00,
          totalPrice: 1000.00,
          batchNumber: "BT001",
          expiryDate: "2025-12-31T00:00:00Z",
          product: {
            id: "prod_001",
            name: "Paracetamol 500mg",
            unitType: "tablets",
            barcode: "1234567890123"
          }
        },
        {
          id: "item_002",
          productId: "prod_002",
          quantity: 1,
          unitPrice: 500.00,
          totalPrice: 500.00,
          batchNumber: "BT002",
          expiryDate: "2025-06-30T00:00:00Z",
          product: {
            id: "prod_002",
            name: "Ibuprofen 400mg",
            unitType: "tablets",
            barcode: "1234567890124"
          }
        }
      ],
      receipts: [
        {
          id: "receipt_001",
          receiptNumber: "RCP-20240115-001",
          printedAt: "2024-01-15T10:30:00Z"
        }
      ]
    },
    {
      id: "sale_002",
      customerId: "cust_002",
      userId: "user_001",
      branchId: "branch_001",
      subtotal: 800.00,
      taxAmount: 136.00,
      discountAmount: 50.00,
      totalAmount: 886.00,
      paymentMethod: "CARD",
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
      createdAt: "2024-01-14T14:20:00Z",
      customer: {
        id: "cust_002",
        name: "Fatima Ali",
        phone: "+92 301 2345678",
        email: "fatima.ali@email.com",
        address: "DHA Phase 5, Karachi"
      },
      user: {
        id: "user_001",
        name: "Dr. Ahmed Khan",
        username: "ahmed.khan"
      },
      branch: {
        id: "branch_001",
        name: "Main Branch",
        address: "123 Main Street, Lahore"
      },
      items: [
        {
          id: "item_003",
          productId: "prod_003",
          quantity: 1,
          unitPrice: 800.00,
          totalPrice: 800.00,
          batchNumber: "BT003",
          expiryDate: "2025-03-15T00:00:00Z",
          product: {
            id: "prod_003",
            name: "Vitamin D3 1000IU",
            unitType: "capsules",
            barcode: "1234567890125"
          }
        }
      ],
      receipts: [
        {
          id: "receipt_002",
          receiptNumber: "RCP-20240114-002",
          printedAt: "2024-01-14T14:20:00Z"
        }
      ]
    }
  ];

  // Invoice lookup functionality
  const lookupInvoice = async () => {
    if (!refundReceiptNumber.trim()) {
      alert("Please enter a receipt number");
      return;
    }

    try {
      setInvoiceLookupLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load invoices from localStorage (same source as Invoices tab)
      const storedInvoices = localStorage.getItem('mockInvoices');
      let allInvoices = mockInvoices; // Fallback to mock data
      
      if (storedInvoices) {
        try {
          allInvoices = JSON.parse(storedInvoices);
        } catch (e) {
          console.warn('Error parsing stored invoices, using mock data');
        }
      }
      
      // Find invoice by receipt number
      const foundInvoice = allInvoices.find(invoice => 
        invoice.receipts.some(receipt => 
          receipt.receiptNumber.toLowerCase() === refundReceiptNumber.toLowerCase()
        )
      );
      
      if (foundInvoice) {
        setFoundInvoice(foundInvoice);
        alert(`Invoice found! Receipt: ${foundInvoice.receipts[0]?.receiptNumber || 'N/A'}`);
      } else {
        const availableReceipts = allInvoices.map(invoice => invoice.receipts[0]?.receiptNumber).filter(Boolean).join(', ');
        alert(`Invoice not found. Available receipts: ${availableReceipts || 'None'}`);
        setFoundInvoice(null);
      }
    } catch (error: any) {
      console.error('Error looking up invoice:', error);
      alert('Error looking up invoice. Please try again.');
      setFoundInvoice(null);
    } finally {
      setInvoiceLookupLoading(false);
    }
  };

  // Process refund for found invoice
  const processInvoiceRefund = async () => {
    if (!foundInvoice) {
      alert("No invoice found to refund");
      return;
    }

    if (!refundReason.trim()) {
      alert("Please enter a refund reason");
      return;
    }

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process refund for all items in the invoice
      const totalRefundAmount = foundInvoice.totalAmount;
      
      // Create refund record
      const refundRecord = {
        id: `refund_${Date.now()}`,
        originalInvoiceId: foundInvoice.id,
        originalInvoiceNumber: foundInvoice.invoiceNumber,
        receiptNumber: foundInvoice.receipts[0]?.receiptNumber,
        refundAmount: totalRefundAmount,
        refundReason: refundReason,
        refundedAt: new Date().toISOString(),
        refundedBy: user?.name || "Cashier",
        items: foundInvoice.items.map((item: any) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          unitType: item.product.unitType
        })),
        customer: foundInvoice.customer
      };

      // Store refund record in localStorage
      const existingRefunds = JSON.parse(localStorage.getItem('refundedInvoices') || '[]');
      existingRefunds.unshift(refundRecord);
      localStorage.setItem('refundedInvoices', JSON.stringify(existingRefunds));

      // Update the original invoice to mark as refunded
      const storedInvoices = localStorage.getItem('mockInvoices');
      if (storedInvoices) {
        try {
          const allInvoices = JSON.parse(storedInvoices);
          const updatedInvoices = allInvoices.map((invoice: any) => 
            invoice.id === foundInvoice.id 
              ? { ...invoice, status: 'REFUNDED', refundedAt: new Date().toISOString() }
              : invoice
          );
          localStorage.setItem('mockInvoices', JSON.stringify(updatedInvoices));
        } catch (e) {
          console.warn('Error updating invoice status');
        }
      }

      // Restore stock in database for each refunded item
      console.log('Restoring stock for refunded items:', foundInvoice.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        reason: 'Refund - Item returned',
        reference: foundInvoice.id
      })));

      // Update stock for each refunded item
      for (const item of foundInvoice.items) {
        try {
          const stockResponse = await apiService.updateStock(item.productId, {
            type: 'IN',
            quantity: item.quantity,
            reason: 'Refund - Item returned',
            reference: foundInvoice.id
          });
          
          if (stockResponse.success) {
            console.log(`Stock restored for ${item.product.name}: +${item.quantity} units`);
          } else {
            console.error(`Failed to restore stock for ${item.product.name}:`, stockResponse.message);
          }
        } catch (error) {
          console.error(`Error restoring stock for ${item.product.name}:`, error);
        }
      }

      // Reload products to update the UI
      await loadProducts();

      alert(`Refund processed successfully!
      
Receipt: ${foundInvoice.receipts[0]?.receiptNumber || 'N/A'}
Refund Amount: PKR ${totalRefundAmount.toFixed(2)}
Reason: ${refundReason}

Items Refunded:
${foundInvoice.items.map((item: any) => `• ${item.product.name} - ${item.quantity} ${item.product.unitType} - PKR ${item.totalPrice.toFixed(2)}`).join('\n')}

All items have been restored to inventory.
Invoice marked as refunded.`);

      // Reset form
      setRefundReceiptNumber("");
      setRefundReason("");
      setFoundInvoice(null);
      setIsRefundDialogOpen(false);

      // Notify other components about the refund
      window.dispatchEvent(new CustomEvent('invoiceRefunded', { 
        detail: { refund: refundRecord } 
      }));

    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund. Please try again.');
    }
  };

  // Refund and return functionality
  const processRefund = async () => {
    if (!refundReceiptNumber.trim()) {
      alert("Please enter a receipt number");
      return;
    }

    if (refundItems.length === 0) {
      alert("Please add items to refund");
      return;
    }

    try {
      // In a real implementation, you would call the backend API to process refund
      const totalRefundAmount = refundItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Simulate refund processing
      alert(`Refund processed successfully!
      
Receipt Number: ${refundReceiptNumber}
Refund Amount: PKR ${totalRefundAmount.toFixed(2)}
Reason: ${refundReason}

Items Refunded:
${refundItems.map(item => `• ${item.name} - ${item.quantity} units - PKR ${item.totalPrice.toFixed(2)}`).join('\n')}

Refund will be processed within 3-5 business days.`);

      // Reset refund form
      setRefundReceiptNumber("");
      setRefundReason("");
      setRefundItems([]);
      setIsRefundDialogOpen(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund. Please try again.');
    }
  };

  const addRefundItem = (item: CartItem, quantity: number, reason: string) => {
    if (quantity <= 0) return;

    const refundItem: RefundItem = {
      id: item.id,
      name: item.name,
      quantity: quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * quantity,
      reason: reason
    };

    setRefundItems([...refundItems, refundItem]);
  };

  const removeRefundItem = (itemId: string) => {
    setRefundItems(refundItems.filter(item => item.id !== itemId));
  };

  // Gift card functionality
  const validateGiftCard = async (cardNumber: string) => {
    // In a real implementation, you would call the backend API to validate the gift card
    // For demo purposes, we'll simulate some gift cards
    const sampleGiftCards: GiftCard[] = [
      { id: "1", number: "1234567890123456", balance: 500, isActive: true, expiryDate: "2025-12-31" },
      { id: "2", number: "2345678901234567", balance: 1000, isActive: true, expiryDate: "2025-06-30" },
      { id: "3", number: "3456789012345678", balance: 250, isActive: true, expiryDate: "2024-12-31" },
      { id: "4", number: "4567890123456789", balance: 0, isActive: false, expiryDate: "2023-12-31" }
    ];

    const giftCard = sampleGiftCards.find(card => card.number === cardNumber);
    
    if (!giftCard) {
      alert("Gift card not found");
      return false;
    }

    if (!giftCard.isActive) {
      alert("Gift card is inactive");
      return false;
    }

    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      alert("Gift card has expired");
      return false;
    }

    setGiftCardBalance(giftCard.balance);
    return true;
  };

  const applyGiftCard = () => {
    if (!giftCardNumber.trim()) {
      alert("Please enter a gift card number");
      return;
    }

    if (giftCardAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (giftCardAmount > giftCardBalance) {
      alert(`Insufficient balance. Available: PKR ${giftCardBalance.toFixed(2)}`);
      return;
    }

    if (giftCardAmount > total) {
      alert(`Amount cannot exceed total. Total: PKR ${total.toFixed(2)}`);
      return;
    }

    // Add gift card payment to split payments
    addSplitPayment('gift_card', giftCardAmount, giftCardNumber);
    
    // Reset gift card form
    setGiftCardNumber("");
    setGiftCardAmount(0);
    setGiftCardBalance(0);
    
    alert(`Gift card applied successfully! Amount: PKR ${giftCardAmount.toFixed(2)}`);
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
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsInvoiceDialogOpen(true)}
                  className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Create Invoice for New Customer
                </Button>
                <Button
                  onClick={() => setIsRefundDialogOpen(true)}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Refunds & Returns
                </Button>
              </div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
                disabled={loading}
                className="h-12 px-3"
                title="Refresh Products"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-4"
                onClick={handleBarcodeScan}
                disabled={isScanning}
              >
                <Scan className="w-5 h-5" />
                {isScanning ? 'Scanning...' : 'Scan'}
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
                      {/* Product Name */}
                      <div className="text-center">
                        <h4 className="font-medium text-sm text-foreground mb-2">{product.name}</h4>
                      </div>

                      {/* Price and Stock */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">PKR {product.price}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.stock} left
                        </Badge>
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
                {currentReceipt?.customer?.phone && (
                  <Button variant="outline" size="sm" onClick={sendSMSReceipt}>
                    <Phone className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                )}
                {currentReceipt?.customer?.email && (
                  <Button variant="outline" size="sm" onClick={sendEmailReceipt}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                )}
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
      <Dialog open={isInvoiceDialogOpen} onOpenChange={(open) => {
        setIsInvoiceDialogOpen(open);
        if (!open) {
          // Reset promotions when dialog is closed
          setAppliedPromotions([]);
          setPromoCode("");
          setDiscountAmount(0);
        }
      }}>
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

              {/* Promotions & Discounts Section */}
              {invoiceItems.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium text-sm">Promotions & Discounts</h4>
                  
                  {/* Applied Promotions */}
                  {appliedPromotions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Applied Promotions:</p>
                      {appliedPromotions.map((promotion) => (
                        <div key={promotion.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-green-800">{promotion.name}</p>
                            <p className="text-xs text-green-600">Code: {promotion.code}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePromotion(promotion.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Apply Promotion */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter promotion code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={applyPromotion}
                      variant="outline"
                      size="sm"
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>

                  {/* Discount Amount Display */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Discount Applied</span>
                      <span className="text-sm font-bold text-green-800">-PKR {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

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
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-PKR {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">PKR {((invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0) * 1.17) - discountAmount).toFixed(2)}</span>
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

      {/* Refunds & Returns Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={(open) => {
        setIsRefundDialogOpen(open);
        if (!open) {
          // Reset form when dialog is closed
          setRefundReceiptNumber("");
          setRefundReason("");
          setFoundInvoice(null);
          setRefundItems([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Refunds & Returns</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Lookup Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Invoice Lookup</h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter invoice/receipt number"
                  value={refundReceiptNumber}
                  onChange={(e) => setRefundReceiptNumber(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={lookupInvoice}
                  variant="outline"
                  disabled={invoiceLookupLoading}
                >
                  {invoiceLookupLoading ? 'Looking up...' : 'Lookup Invoice'}
                </Button>
                <Button
                  onClick={() => {
                    // Load invoices from localStorage (same source as lookup)
                    const storedInvoices = localStorage.getItem('mockInvoices');
                    let allInvoices = mockInvoices; // Fallback to mock data
                    
                    if (storedInvoices) {
                      try {
                        allInvoices = JSON.parse(storedInvoices);
                      } catch (e) {
                        console.warn('Error parsing stored invoices, using mock data');
                      }
                    }
                    
                    const receiptNumbers = allInvoices.map(invoice => invoice.receipts[0]?.receiptNumber).filter(Boolean).join('\n');
                    alert(`Available Receipt Numbers:\n\n${receiptNumbers || 'None'}\n\nTry entering one of these receipt numbers to test the refund functionality.`);
                  }}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Show Available
                </Button>
              </div>
            </div>

            {/* Found Invoice Display */}
            {foundInvoice && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Found Invoice</h3>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Invoice Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">Receipt: {foundInvoice.receipts[0]?.receiptNumber || 'N/A'}</h4>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(foundInvoice.createdAt).toLocaleDateString()} {new Date(foundInvoice.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cashier: {foundInvoice.user.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            PKR {foundInvoice.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {foundInvoice.paymentMethod} • {foundInvoice.paymentStatus}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      {foundInvoice.customer && (
                        <div className="border-t pt-3">
                          <h5 className="font-medium text-sm mb-2">Customer Information</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><strong>Name:</strong> {foundInvoice.customer.name}</p>
                            <p><strong>Phone:</strong> {foundInvoice.customer.phone}</p>
                            {foundInvoice.customer.email && (
                              <p><strong>Email:</strong> {foundInvoice.customer.email}</p>
                            )}
                            {foundInvoice.customer.address && (
                              <p><strong>Address:</strong> {foundInvoice.customer.address}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Items List */}
                      <div className="border-t pt-3">
                        <h5 className="font-medium text-sm mb-2">Items in Invoice</h5>
                        <div className="space-y-2">
                          {foundInvoice.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity} {item.product.unitType} × PKR {item.unitPrice.toFixed(2)}
                                  {item.batchNumber && ` • Batch: ${item.batchNumber}`}
                                  {item.expiryDate && ` • Exp: ${new Date(item.expiryDate).toLocaleDateString()}`}
                                </p>
                              </div>
                              <p className="font-semibold text-sm">PKR {item.totalPrice.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Invoice Summary */}
                      <div className="border-t pt-3">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>PKR {foundInvoice.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GST (17%):</span>
                            <span>PKR {foundInvoice.taxAmount.toFixed(2)}</span>
                          </div>
                          {foundInvoice.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span>-PKR {foundInvoice.discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-1">
                            <span>Total:</span>
                            <span>PKR {foundInvoice.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="border-t pt-3">
                        <Button
                          onClick={processInvoiceRefund}
                          className="w-full text-white bg-red-600 hover:bg-red-700"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Process Full Refund & Return Items to Stock
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Refund Reason */}
            {foundInvoice && (
              <div className="space-y-2">
                <Label htmlFor="refundReason">Refund Reason *</Label>
                <Input
                  id="refundReason"
                  placeholder="Enter reason for refund"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsRefundDialogOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              {foundInvoice && (
                <Button
                  onClick={processInvoiceRefund}
                  className="text-white bg-red-600 hover:bg-red-700"
                  disabled={!refundReason.trim()}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Process Refund
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSInterface;