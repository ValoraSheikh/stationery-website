"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ProductData {
  _id: string;
  images: string[];
  name: string;
  brandName: string;
}

interface OrderItem {
  productId: string | ProductData;
  variantSku?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Address {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface Order {
  orderId: string;
  userId: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paymentMethod: "cod" | "upi" | "online" | "netbanking" | "wallet";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  transactionId?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  expectedDelivery?: string;
  deliveredAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusMessage = (status: string) => {
  const messages = {
    pending: "Your order is being processed.",
    confirmed: "Your order has been confirmed!",
    shipped: "It's on the way!",
    delivered: "Your order has been delivered!",
    cancelled: "This order has been cancelled.",
    refunded: "This order has been refunded.",
  };
  return messages[status as keyof typeof messages] || "Order placed successfully.";
};

const getPaymentMethodDisplay = (method: string) => {
  const methods = {
    cod: "Cash on Delivery",
    upi: "UPI",
    online: "Online Payment",
    netbanking: "Net Banking",
    wallet: "Wallet",
  };
  return methods[method as keyof typeof methods] || method.toUpperCase();
};

// Helper to check if productId is populated
const isPopulatedProduct = (productId: string | ProductData): productId is ProductData => {
  return typeof productId === 'object' && productId !== null && 'images' in productId;
};

export default function OrderSummary() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/order");

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please log in to view your orders.");
          } else if (response.status === 404) {
            setError("No orders found. Place your first order to see it here!");
          } else {
            setError("Failed to load order. Please try again.");
          }
          return;
        }

        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Something went wrong. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <span className="ml-3 text-lg text-gray-600">Loading your order...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {error || "Order not found"}
            </h2>
            <p className="mt-2 text-gray-600">
              {error === "No orders found. Place your first order to see it here!" 
                ? "Start shopping to create your first order." 
                : "Please try refreshing the page."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = {
    pending: "text-yellow-600",
    confirmed: "text-blue-600",
    shipped: "text-indigo-600",
    delivered: "text-green-600",
    cancelled: "text-red-600",
    refunded: "text-gray-600",
  }[order.status] || "text-gray-700";

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-xl">
          <h1 className={`text-base font-medium ${statusColor}`}>
            {order.status === "delivered" ? "Thank you!" : "Order Placed"}
          </h1>
          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {getStatusMessage(order.status)}
          </p>
          <p className="mt-2 text-base text-gray-500">
            Your order #{order.orderId} 
            {order.status === "shipped" && " has shipped and will be with you soon."}
            {order.status === "delivered" && order.deliveredAt && 
              ` was delivered on ${formatDate(order.deliveredAt)}.`}
            {order.expectedDelivery && order.status === "shipped" &&
              ` Expected delivery: ${formatDate(order.expectedDelivery)}`}
          </p>

          {order.transactionId && (
            <dl className="mt-12 text-sm font-medium">
              <dt className="text-gray-900">Transaction ID</dt>
              <dd className={`mt-2 ${statusColor}`}>{order.transactionId}</dd>
            </dl>
          )}

          <dl className="mt-6 text-sm font-medium">
            <dt className="text-gray-900">Order Status</dt>
            <dd className={`mt-2 ${statusColor} capitalize`}>{order.status}</dd>
          </dl>
        </div>

        <div className="mt-10 border-t border-gray-200">
          <h2 className="sr-only">Your order</h2>

          <h3 className="sr-only">Items</h3>
          {order.items.map((item, idx) => {
            const product = isPopulatedProduct(item.productId) ? item.productId : null;
            const hasImage = product?.images && product.images.length > 0;

            return (
              <div
                key={idx}
                className="flex space-x-6 border-b border-gray-200 py-10"
              >
                {hasImage ? (
                  <div className="relative size-20 sm:size-40 flex-none">
                    <Image
                      src={product.images[0]}
                      alt={item.name}
                      fill
                      className="rounded-lg bg-gray-100 object-cover"
                      sizes="(max-width: 640px) 80px, 160px"
                    />
                  </div>
                ) : (
                  <div className="size-20 flex-none rounded-lg bg-gray-100 sm:size-40 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-auto flex-col">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.variantSku && (
                      <p className="mt-1 text-sm text-gray-500">SKU: {item.variantSku}</p>
                    )}
                  </div>
                  <div className="mt-6 flex flex-1 items-end">
                    <dl className="flex divide-x divide-gray-200 text-sm">
                      <div className="flex pr-4 sm:pr-6">
                        <dt className="font-medium text-gray-900">Quantity</dt>
                        <dd className="ml-2 text-gray-700">{item.quantity}</dd>
                      </div>
                      <div className="flex pl-4 sm:pl-6">
                        <dt className="font-medium text-gray-900">Price</dt>
                        <dd className="ml-2 text-gray-700">{formatCurrency(item.price)}</dd>
                      </div>
                      <div className="flex pl-4 sm:pl-6">
                        <dt className="font-medium text-gray-900">Total</dt>
                        <dd className="ml-2 text-gray-700">{formatCurrency(item.total)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="sm:ml-40 sm:pl-6">
            <h3 className="sr-only">Your information</h3>

            <h4 className="sr-only">Addresses</h4>
            <dl className="grid grid-cols-2 gap-x-6 py-10 text-sm">
              <div>
                <dt className="font-medium text-gray-900">Shipping address</dt>
                <dd className="mt-2 text-gray-700">
                  <address className="not-italic">
                    <span className="block">{order.shippingAddress.name}</span>
                    <span className="block">{order.shippingAddress.phone}</span>
                    {order.shippingAddress.email && (
                      <span className="block">{order.shippingAddress.email}</span>
                    )}
                    <span className="block mt-2">{order.shippingAddress.addressLine1}</span>
                    {order.shippingAddress.addressLine2 && (
                      <span className="block">{order.shippingAddress.addressLine2}</span>
                    )}
                    <span className="block">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </span>
                    <span className="block">{order.shippingAddress.country}</span>
                  </address>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Billing address</dt>
                <dd className="mt-2 text-gray-700">
                  {order.billingAddress ? (
                    <address className="not-italic">
                      <span className="block">{order.billingAddress.name}</span>
                      <span className="block">{order.billingAddress.phone}</span>
                      {order.billingAddress.email && (
                        <span className="block">{order.billingAddress.email}</span>
                      )}
                      <span className="block mt-2">{order.billingAddress.addressLine1}</span>
                      {order.billingAddress.addressLine2 && (
                        <span className="block">{order.billingAddress.addressLine2}</span>
                      )}
                      <span className="block">
                        {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.pincode}
                      </span>
                      <span className="block">{order.billingAddress.country}</span>
                    </address>
                  ) : (
                    <p className="text-gray-500">Same as shipping address</p>
                  )}
                </dd>
              </div>
            </dl>

            <h4 className="sr-only">Payment</h4>
            <dl className="grid grid-cols-2 gap-x-6 border-t border-gray-200 py-10 text-sm">
              <div>
                <dt className="font-medium text-gray-900">Payment method</dt>
                <dd className="mt-2 text-gray-700">
                  <p>{getPaymentMethodDisplay(order.paymentMethod)}</p>
                  <p className="mt-1 capitalize">
                    Status: <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>
                      {order.paymentStatus}
                    </span>
                  </p>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Order date</dt>
                <dd className="mt-2 text-gray-700">
                  <p>{formatDate(order.createdAt)}</p>
                  {order.expectedDelivery && (
                    <p className="mt-1 text-sm text-gray-500">
                      Expected: {formatDate(order.expectedDelivery)}
                    </p>
                  )}
                </dd>
              </div>
            </dl>

            <h3 className="sr-only">Summary</h3>

            <dl className="space-y-6 border-t border-gray-200 pt-10 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-900">Subtotal</dt>
                <dd className="text-gray-700">{formatCurrency(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-900">Discount</dt>
                  <dd className="text-green-600">-{formatCurrency(order.discount)}</dd>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-900">Tax</dt>
                  <dd className="text-gray-700">{formatCurrency(order.taxAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="font-medium text-gray-900">Shipping</dt>
                <dd className="text-gray-700">
                  {order.shippingCost === 0 ? "Free" : formatCurrency(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-6">
                <dt className="text-base font-medium text-gray-900">Total</dt>
                <dd className="text-base font-medium text-gray-900">
                  {formatCurrency(order.grandTotal)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}