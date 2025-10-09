"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Eye, Edit, Trash, DollarSign } from "lucide-react";
import Image from "next/image";

// Mock API functions (replace with real API)
async function fetchOrders(page: number, filters: any) {
  // Simulate fetch
  return {
    orders: mockOrders.slice((page - 1) * 10, page * 10),
    total: mockOrders.length,
    summary: {
      totalOrders: 100,
      pendingOrders: 20,
      deliveredOrders: 50,
      totalRevenue: 50000,
    },
  };
}

async function updateOrder(id: string, data: any) {
  console.log("Update order", id, data);
  // Simulate update
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-500",
  confirmed: "bg-blue-500",
  shipped: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  refunded: "bg-red-500",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-gray-500",
  paid: "bg-green-500",
  failed: "bg-red-500",
  refunded: "bg-red-500",
};

// Mock data
const mockOrders = Array.from({ length: 50 }, (_, i) => ({
  orderId: `ORD-${i + 1}`,
  userId: `User ${i + 1}`,
  userName: `John Doe ${i + 1}`,
  userEmail: `john${i + 1}@example.com`,
  items: [
    {
      sku: "SKU1",
      name: "Product 1",
      variant: "Red",
      quantity: 2,
      price: 10,
      total: 20,
      image: "/placeholder.png",
    },
  ],
  grandTotal: 100 + i,
  status: ["pending", "confirmed", "shipped", "delivered", "cancelled"][
    Math.floor(Math.random() * 5)
  ],
  paymentStatus: ["pending", "paid", "failed", "refunded"][
    Math.floor(Math.random() * 4)
  ],
  paymentMethod: "Credit Card",
  createdAt: new Date().toISOString(),
  customer: {
    name: `John Doe ${i + 1}`,
    email: `john${i + 1}@example.com`,
    phone: "123-456-7890",
    billingAddress: "123 Main St",
    shippingAddress: "123 Main St",
  },
  paymentInfo: {
    method: "Credit Card",
    status: "paid",
    transactionId: "TXN123",
    subtotal: 90,
    discount: 0,
    tax: 10,
    shipping: 5,
    grandTotal: 105,
  },
  shipping: {
    status: "pending",
    deliveredDate: null,
    expectedDelivery: new Date().toISOString(),
  },
  notes: [{ text: "Note 1", timestamp: new Date().toISOString() }],
}));

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    orderId: "",
    user: "",
    status: "",
    paymentStatus: "",
    fromDate: undefined as Date | undefined,
    toDate: undefined as Date | undefined,
    minValue: "",
    maxValue: "",
  });
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, filters]);

  async function loadOrders() {
    const data = await fetchOrders(page, filters);
    setOrders(data.orders);
    setTotal(data.total);
    setSummary(data.summary);
  }

  function handleFilterChange(key: string, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function openDrawer(order: any) {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  }

  function handleUpdateStatus(newStatus: string) {
    if (selectedOrder) {
      updateOrder(selectedOrder.orderId, { status: newStatus });
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      loadOrders();
    }
  }

  function handleUpdatePaymentStatus(newStatus: string) {
    if (selectedOrder) {
      updateOrder(selectedOrder.orderId, { paymentStatus: newStatus });
      setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
      loadOrders();
    }
  }

  function handleCancel(reason: string) {
    if (selectedOrder) {
      updateOrder(selectedOrder.orderId, { status: "cancelled", reason });
      setSelectedOrder({ ...selectedOrder, status: "cancelled" });
      loadOrders();
      setIsDrawerOpen(false);
    }
  }

  function handleRefund(reason: string) {
    if (selectedOrder) {
      updateOrder(selectedOrder.orderId, { paymentStatus: "refunded", reason });
      setSelectedOrder({ ...selectedOrder, paymentStatus: "refunded" });
      loadOrders();
      setIsDrawerOpen(false);
    }
  }

  function handleAddNote(note: string) {
    if (selectedOrder) {
      const newNotes = [
        ...selectedOrder.notes,
        { text: note, timestamp: new Date().toISOString() },
      ];
      updateOrder(selectedOrder.orderId, { notes: newNotes });
      setSelectedOrder({ ...selectedOrder, notes: newNotes });
    }
  }

  const statusSelectValue = filters.status === "" ? "all" : filters.status;
  const paymentStatusSelectValue =
    filters.paymentStatus === "" ? "all" : filters.paymentStatus;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Orders Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Delivered Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.deliveredOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalRevenue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Input
          placeholder="Order ID"
          value={filters.orderId}
          onChange={(e) => handleFilterChange("orderId", e.target.value)}
        />
        <Input
          placeholder="User name/email"
          value={filters.user}
          onChange={(e) => handleFilterChange("user", e.target.value)}
        />
        <Select
          value={statusSelectValue}
          onValueChange={(v) =>
            handleFilterChange("status", v === "all" ? "" : v)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={paymentStatusSelectValue}
          onValueChange={(v) =>
            handleFilterChange("paymentStatus", v === "all" ? "" : v)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.fromDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.fromDate ? (
                format(filters.fromDate, "PPP")
              ) : (
                <span>From Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.fromDate}
              onSelect={(date) => handleFilterChange("fromDate", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.toDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.toDate ? (
                format(filters.toDate, "PPP")
              ) : (
                <span>To Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.toDate}
              onSelect={(date) => handleFilterChange("toDate", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Input
          type="number"
          placeholder="Min Order Value"
          value={filters.minValue}
          onChange={(e) => handleFilterChange("minValue", e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max Order Value"
          value={filters.maxValue}
          onChange={(e) => handleFilterChange("maxValue", e.target.value)}
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>
                      {order.userName} ({order.userEmail})
                    </TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>${order.grandTotal}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={paymentStatusColors[order.paymentStatus]}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.paymentMethod}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "PPP")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" onClick={() => openDrawer(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 space-x-2">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {Math.ceil(total / 10)}
        </span>
        <Button disabled={page * 10 >= total} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>

      {/* Order Details Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Order Details: {selectedOrder?.orderId}</DrawerTitle>
          </DrawerHeader>
          {selectedOrder && (
            <Tabs defaultValue="customer" className="p-4">
              <TabsList className="flex overflow-x-auto">
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="payment">Payment Info</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Status</TabsTrigger>
                <TabsTrigger value="notes">Notes / Audit</TabsTrigger>
              </TabsList>
              <TabsContent value="customer">
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {selectedOrder.customer.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedOrder.customer.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedOrder.customer.phone}
                  </p>
                  <details>
                    <summary>Billing Address</summary>
                    <p>{selectedOrder.customer.billingAddress}</p>
                  </details>
                  <details>
                    <summary>Shipping Address</summary>
                    <p>{selectedOrder.customer.shippingAddress}</p>
                  </details>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" /> Edit Addresses
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="items">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Image
                              height={500}
                              width={500}
                              src={item.image}
                              alt="product"
                              className="h-10 w-10"
                            />
                          </TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.variant}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.price}</TableCell>
                          <TableCell>${item.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="payment">
                <div className="space-y-2">
                  <p>
                    <strong>Method:</strong> {selectedOrder.paymentInfo.method}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge
                      className={
                        paymentStatusColors[selectedOrder.paymentInfo.status]
                      }
                    >
                      {selectedOrder.paymentInfo.status}
                    </Badge>
                  </p>
                  <p>
                    <strong>Transaction ID:</strong>{" "}
                    {selectedOrder.paymentInfo.transactionId}
                  </p>
                  <p>
                    <strong>Subtotal:</strong> $
                    {selectedOrder.paymentInfo.subtotal}
                  </p>
                  <p>
                    <strong>Discount:</strong> $
                    {selectedOrder.paymentInfo.discount}
                  </p>
                  <p>
                    <strong>Tax:</strong> ${selectedOrder.paymentInfo.tax}
                  </p>
                  <p>
                    <strong>Shipping:</strong> $
                    {selectedOrder.paymentInfo.shipping}
                  </p>
                  <p>
                    <strong>Grand Total:</strong> $
                    {selectedOrder.paymentInfo.grandTotal}
                  </p>
                  <Select onValueChange={handleUpdatePaymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedOrder.paymentStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>View/Print Invoice</Button>
                </div>
              </TabsContent>
              <TabsContent value="shipping">
                <div className="space-y-2">
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge
                      className={statusColors[selectedOrder.shipping.status]}
                    >
                      {selectedOrder.shipping.status}
                    </Badge>
                  </p>
                  <p>
                    <strong>Delivered Date:</strong>{" "}
                    {selectedOrder.shipping.deliveredDate
                      ? format(
                          new Date(selectedOrder.shipping.deliveredDate),
                          "PPP"
                        )
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Expected Delivery:</strong>{" "}
                    {format(
                      new Date(selectedOrder.shipping.expectedDelivery),
                      "PPP"
                    )}
                  </p>
                  <Select onValueChange={handleUpdateStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedOrder.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <div>
                    <Label>Cancel with Reason</Label>
                    <Textarea placeholder="Reason" />
                    <Button onClick={() => handleCancel("reason")}>
                      Cancel
                    </Button>
                  </div>
                  <div>
                    <Label>Refund with Reason</Label>
                    <Textarea placeholder="Reason" />
                    <Button onClick={() => handleRefund("reason")}>
                      Refund
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notes">
                <div className="space-y-2">
                  {selectedOrder.notes.map((note: any, idx: number) => (
                    <p key={idx}>
                      <strong>
                        {format(new Date(note.timestamp), "PPP pp")}:
                      </strong>{" "}
                      {note.text}
                    </p>
                  ))}
                  <Label>Add Note</Label>
                  <Textarea placeholder="New note" />
                  <Button onClick={() => handleAddNote("new note")}>Add</Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
