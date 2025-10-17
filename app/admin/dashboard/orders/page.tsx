/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { CalendarIcon, Eye, Edit, DollarSign } from "lucide-react";
import Image from "next/image";

// ---------- Helpers ----------

function formatAddress(addr: any) {
  if (!addr) return "";
  const parts = [] as string[];
  if (addr.name) parts.push(addr.name);
  if (addr.addressLine1) parts.push(addr.addressLine1);
  if (addr.addressLine2) parts.push(addr.addressLine2);
  const cityStatePin = [addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");
  if (cityStatePin) parts.push(cityStatePin);
  if (addr.country) parts.push(addr.country);
  return parts.filter(Boolean).join(" / ");
}

function safeFormatDate(value: any, fmt = "PPP") {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return format(d, fmt);
}

// ---------- API functions ----------

async function fetchOrders(page: number, filters: any) {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));

    // Add filters as query params if present
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (v instanceof Date) {
        params.set(k, v.toISOString());
      } else {
        params.set(k, String(v));
      }
    });

    const res = await fetch(`/api/admin/order?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed fetching orders: ${res.status}`);
    }

    const json = await res.json();
    const ordersFromApi = json.orders || [];

    const mapped = ordersFromApi.map((o: any) => ({
      orderId: o.orderId,
      userName: o.user ? o.user.name : o.userName || "",
      userEmail: o.user ? o.user.email : o.userEmail || "",
      items: (o.items || []).map((it: any) => ({
        sku: it.variantSku || it.sku || "",
        name: it.name,
        variant: it.variantSku || it.variant || "",
        quantity: it.quantity,
        price: it.price,
        total: it.total,
        image: it.product?.image || it.image || "/placeholder.png",
      })),
      grandTotal: o.grandTotal,
      status: o.status,
      paymentStatus: o.payment?.status || o.paymentStatus || "",
      paymentMethod: o.payment?.method || o.paymentMethod || "",
      createdAt: o.createdAt,
      customer: {
        name: o.user?.name || o.customer?.name || o.userName || "",
        email: o.user?.email || o.customer?.email || o.userEmail || "",
        phone: o.shippingAddress?.phone || o.customer?.phone || "",
        billingAddress: o.billingAddress
          ? formatAddress(o.billingAddress)
          : o.shippingAddress
          ? formatAddress(o.shippingAddress)
          : "",
        shippingAddress: o.shippingAddress
          ? formatAddress(o.shippingAddress)
          : "",
      },
      paymentInfo: {
        method: o.payment?.method || o.paymentMethod || "",
        status: o.payment?.status || o.paymentStatus || "",
        transactionId: o.payment?.transactionId || o.transactionId || "",
        subtotal: o.subtotal ?? 0,
        discount: o.discount ?? 0,
        tax: o.taxAmount ?? 0,
        shipping: o.shippingCost ?? 0,
        grandTotal: o.grandTotal ?? 0,
      },
      shipping: {
        status: o.status,
        deliveredDate: o.deliveredAt,
        expectedDelivery: o.expectedDelivery,
      },
      notes: o.notes || [],
    }));

    return {
      orders: mapped,
      total: json.total ?? mapped.length,
      summary: json.summary ?? {
        totalOrders: mapped.length,
        pendingOrders: mapped.filter((x: any) => x.status === "pending").length,
        deliveredOrders: mapped.filter((x: any) => x.status === "delivered")
          .length,
        totalRevenue: mapped.reduce(
          (s: number, x: any) => s + (Number(x.grandTotal) || 0),
          0
        ),
      },
    };
  } catch (err) {
    console.error("fetchOrders error", err);

    // Fallback: return empty list so UI still renders without changing styles
    return {
      orders: [],
      total: 0,
      summary: {
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
      },
    };
  }
}

async function updateOrder(id: string, data: any) {
  try {
    const payload = { orderId: id, ...data }; // include orderId for compatibility

    // First: try the dynamic route
    const encodedId = encodeURIComponent(id);
    console.log(`[client] PATCH -> /api/admin/order/${encodedId}`, payload);
    const res1 = await fetch(`/api/admin/order/${encodedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json1 = await res1.json().catch(() => null);

    if (res1.ok) {
      return json1 ?? { success: true };
    }

    // If not found (404), try the older endpoint that expects orderId in body
    if (res1.status === 404) {
      const res2 = await fetch(`/api/admin/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json2 = await res2.json().catch(() => null);
      if (res2.ok) {
        return json2 ?? { success: true };
      }
      return {
        success: false,
        error: json2?.error || `Failed to update order (${res2.status})`,
      };
    }

    // Other non-OK from first attempt
    return {
      success: false,
      error: json1?.error || `Failed to update order (${res1.status})`,
    };
  } catch (err) {
    console.error("updateOrder error", err);
    return { success: false, error: (err as Error).message || "Unknown error" };
  }
}

// ---------- Colors ----------

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

// ---------- Component ----------

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  async function loadOrders() {
    const data = await fetchOrders(page, filters);
    const ordersToSet = data.orders;
    setOrders(ordersToSet);
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

  async function handleUpdateStatus(newStatus: string) {
    if (!selectedOrder) return;
    const resp = await updateOrder(selectedOrder.orderId, {
      status: newStatus,
    });
    if (resp?.success) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      await loadOrders();
    } else {
      console.error("Failed to update status:", resp?.error);
    }
  }

  async function handleUpdatePaymentStatus(newStatus: string) {
    if (!selectedOrder) return;
    const resp = await updateOrder(selectedOrder.orderId, {
      paymentStatus: newStatus,
    });
    if (resp?.success) {
      setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
      await loadOrders();
    } else {
      console.error("Failed to update payment status:", resp?.error);
    }
  }

  async function handleCancel(reason: string) {
    if (!selectedOrder) return;
    // send cancellationReason field which the API accepts
    const resp = await updateOrder(selectedOrder.orderId, {
      status: "cancelled",
      cancellationReason: reason,
    });
    if (resp?.success) {
      setSelectedOrder({
        ...selectedOrder,
        status: "cancelled",
        cancellationReason: reason,
      });
      await loadOrders();
      setIsDrawerOpen(false);
    } else {
      console.error("Failed to cancel order:", resp?.error);
    }
  }

  async function handleRefund(reason: string) {
    if (!selectedOrder) return;
    // API accepts paymentStatus; include cancellationReason as a best-effort field
    const resp = await updateOrder(selectedOrder.orderId, {
      paymentStatus: "refunded",
      cancellationReason: reason,
    });
    if (resp?.success) {
      setSelectedOrder({ ...selectedOrder, paymentStatus: "refunded" });
      await loadOrders();
      setIsDrawerOpen(false);
    } else {
      console.error("Failed to refund order:", resp?.error);
    }
  }

  async function handleAddNote(note: string) {
    if (!selectedOrder) return;
    // If your server supports updating notes, include it; otherwise this will be ignored by server
    const newNotes = [
      ...(selectedOrder.notes || []),
      { text: note, timestamp: new Date().toISOString() },
    ];
    const resp = await updateOrder(selectedOrder.orderId, { notes: newNotes });
    if (resp?.success) {
      setSelectedOrder({ ...selectedOrder, notes: newNotes });
      // optionally refresh list
      await loadOrders();
    } else {
      console.error("Failed to add note:", resp?.error);
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
            <div className="text-2xl font-bold">₹{summary.totalRevenue}</div>
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
                safeFormatDate(filters.fromDate)
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
                safeFormatDate(filters.toDate)
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
                    <TableCell>₹{order.grandTotal}</TableCell>
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
                      {order.createdAt
                        ? safeFormatDate(order.createdAt)
                        : "N/A"}
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
                          <TableCell>₹{item.price}</TableCell>
                          <TableCell>₹{item.total}</TableCell>
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
                    <strong>Subtotal:</strong> ₹
                    {selectedOrder.paymentInfo.subtotal}
                  </p>
                  <p>
                    <strong>Discount:</strong> ₹
                    {selectedOrder.paymentInfo.discount}
                  </p>
                  <p>
                    <strong>Tax:</strong> ₹{selectedOrder.paymentInfo.tax}
                  </p>
                  <p>
                    <strong>Shipping:</strong> ₹
                    {selectedOrder.paymentInfo.shipping}
                  </p>
                  <p>
                    <strong>Grand Total:</strong> ₹
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
                      ? safeFormatDate(selectedOrder.shipping.deliveredDate)
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Expected Delivery:</strong>{" "}
                    {selectedOrder.shipping.expectedDelivery
                      ? safeFormatDate(selectedOrder.shipping.expectedDelivery)
                      : "N/A"}
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
                        {note.timestamp
                          ? safeFormatDate(note.timestamp, "PPP pp")
                          : "N/A"}
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
