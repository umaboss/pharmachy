import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Package,
  Pill,
  Droplets,
  Syringe,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  product: {
    id: string;
    name: string;
    unitType: string;
    barcode?: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  userId: string;
  branchId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
  };
  branch: {
    id: string;
    name: string;
    address: string;
  };
  items: InvoiceItem[];
  receipts: Array<{
    id: string;
    receiptNumber: string;
    printedAt?: string;
  }>;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data for invoices
  const mockInvoices: Invoice[] = [
    {
      id: "inv_001",
      invoiceNumber: "INV-2024-001",
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
      id: "inv_002",
      invoiceNumber: "INV-2024-002",
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
    },
    {
      id: "inv_003",
      invoiceNumber: "INV-2024-003",
      customerId: "cust_003",
      userId: "user_002",
      branchId: "branch_001",
      subtotal: 2400.00,
      taxAmount: 408.00,
      discountAmount: 100.00,
      totalAmount: 2708.00,
      paymentMethod: "MOBILE",
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
      createdAt: "2024-01-13T16:45:00Z",
      customer: {
        id: "cust_003",
        name: "Hassan Sheikh",
        phone: "+92 302 3456789",
        email: "hassan.sheikh@email.com",
        address: "F-8, Islamabad"
      },
      user: {
        id: "user_002",
        name: "Dr. Sarah Ahmed",
        username: "sarah.ahmed"
      },
      branch: {
        id: "branch_001",
        name: "Main Branch",
        address: "123 Main Street, Lahore"
      },
      items: [
        {
          id: "item_004",
          productId: "prod_004",
          quantity: 3,
          unitPrice: 600.00,
          totalPrice: 1800.00,
          batchNumber: "BT004",
          expiryDate: "2025-08-20T00:00:00Z",
          product: {
            id: "prod_004",
            name: "Amoxicillin 500mg",
            unitType: "capsules",
            barcode: "1234567890126"
          }
        },
        {
          id: "item_005",
          productId: "prod_005",
          quantity: 2,
          unitPrice: 300.00,
          totalPrice: 600.00,
          batchNumber: "BT005",
          expiryDate: "2025-05-10T00:00:00Z",
          product: {
            id: "prod_005",
            name: "Cetirizine 10mg",
            unitType: "tablets",
            barcode: "1234567890127"
          }
        }
      ],
      receipts: [
        {
          id: "receipt_003",
          receiptNumber: "RCP-20240113-003",
          printedAt: "2024-01-13T16:45:00Z"
        }
      ]
    },
    {
      id: "inv_004",
      invoiceNumber: "INV-2024-004",
      customerId: null,
      userId: "user_001",
      branchId: "branch_001",
      subtotal: 1200.00,
      taxAmount: 204.00,
      discountAmount: 0,
      totalAmount: 1404.00,
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      status: "PENDING",
      createdAt: "2024-01-12T09:15:00Z",
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
          id: "item_006",
          productId: "prod_006",
          quantity: 4,
          unitPrice: 300.00,
          totalPrice: 1200.00,
          batchNumber: "BT006",
          expiryDate: "2025-07-25T00:00:00Z",
          product: {
            id: "prod_006",
            name: "Omeprazole 20mg",
            unitType: "capsules",
            barcode: "1234567890128"
          }
        }
      ],
      receipts: []
    }
  ];

  useEffect(() => {
    loadInvoices();
    
    // Listen for new invoices created from POS
    const handleInvoiceCreated = (event: CustomEvent) => {
      loadInvoices();
    };
    
    window.addEventListener('invoiceCreated', handleInvoiceCreated as EventListener);
    
    return () => {
      window.removeEventListener('invoiceCreated', handleInvoiceCreated as EventListener);
    };
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, statusFilter, paymentMethodFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load from localStorage first, then fallback to mock data
      const storedInvoices = localStorage.getItem('mockInvoices');
      if (storedInvoices) {
        const parsedInvoices = JSON.parse(storedInvoices);
        setInvoices(parsedInvoices);
      } else {
        setInvoices(mockInvoices);
        // Store mock data in localStorage for first time
        localStorage.setItem('mockInvoices', JSON.stringify(mockInvoices));
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices(mockInvoices);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer?.phone.includes(searchQuery) ||
        invoice.receipts.some(receipt => 
          receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.paymentMethod === paymentMethodFilter);
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <Banknote className="w-4 h-4" />;
      case "CARD":
        return <CreditCard className="w-4 h-4" />;
      case "MOBILE":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const printInvoice = (invoice: Invoice) => {
    // In a real implementation, this would open a print dialog
    alert(`Printing invoice: ${invoice.invoiceNumber}`);
  };

  const downloadInvoice = (invoice: Invoice) => {
    // In a real implementation, this would download a PDF
    alert(`Downloading invoice: ${invoice.invoiceNumber}`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Invoices</h1>
            <p className="text-muted-foreground">Manage and view all purchase invoices</p>
          </div>
          <Button onClick={loadInvoices} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, customer name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Method Filter */}
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="MOBILE">Mobile</SelectItem>
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center text-sm text-muted-foreground">
                <Filter className="w-4 h-4 mr-2" />
                {filteredInvoices.length} invoice(s) found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-primary" />
              <span>Invoice List</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No invoices found</p>
                <p className="text-xs">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer ? invoice.customer.name : 'Walk-in Customer'}
                          </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          PKR {invoice.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{invoice.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        {getPaymentMethodIcon(invoice.paymentMethod)}
                        <span>{invoice.paymentMethod}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>{invoice.items.length} item(s)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{invoice.branch.name}</span>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <div className="space-y-1">
                        {invoice.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {getUnitIcon(item.product.unitType)}
                              <span>{item.product.name}</span>
                              <span className="text-muted-foreground">
                                ({item.quantity} {item.product.unitType})
                              </span>
                            </div>
                            <span className="font-medium">PKR {item.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                        {invoice.items.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{invoice.items.length - 2} more item(s)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewInvoice(invoice)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printInvoice(invoice)}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(invoice)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details Dialog */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice Details - {selectedInvoice?.invoiceNumber}</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => selectedInvoice && printInvoice(selectedInvoice)}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => selectedInvoice && downloadInvoice(selectedInvoice)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">MediBill Pulse Pharmacy</h2>
                    <p className="text-muted-foreground">Your Health, Our Priority</p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
                      <p><strong>Date:</strong> {formatDate(selectedInvoice.createdAt)}</p>
                      <p><strong>Cashier:</strong> {selectedInvoice.user.name}</p>
                      <p><strong>Branch:</strong> {selectedInvoice.branch.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      PKR {selectedInvoice.totalAmount.toFixed(2)}
                    </p>
                    <div className="mt-2">
                      {getStatusBadge(selectedInvoice.status)}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedInvoice.customer && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Name:</strong> {selectedInvoice.customer.name}</p>
                        <p><strong>Phone:</strong> {selectedInvoice.customer.phone}</p>
                      </div>
                      <div>
                        <p><strong>Email:</strong> {selectedInvoice.customer.email || 'N/A'}</p>
                        <p><strong>Address:</strong> {selectedInvoice.customer.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Items Purchased</h3>
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.product.unitType} × PKR {item.unitPrice.toFixed(2)}
                          {item.batchNumber && ` • Batch: ${item.batchNumber}`}
                          {item.expiryDate && ` • Exp: ${new Date(item.expiryDate).toLocaleDateString()}`}
                        </p>
                      </div>
                      <p className="font-semibold">PKR {item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>PKR {selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (17%):</span>
                    <span>PKR {selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-PKR {selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">PKR {selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Payment Method:</strong> {selectedInvoice.paymentMethod}</p>
                      <p><strong>Status:</strong> {selectedInvoice.paymentStatus}</p>
                    </div>
                    <div>
                      <p><strong>Receipt Number:</strong> {selectedInvoice.receipts[0]?.receiptNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Invoices;
