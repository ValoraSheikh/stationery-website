"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ----- Types ----- */
type OrderItemUI = {
  id: string;
  name: string;
  href: string;
  price: string;
  status: string;
  imageSrc: string;
  imageAlt?: string;
};

type OrderUI = {
  number: string;
  date: string; // human readable
  datetime: string; // ISO yyyy-mm-dd
  invoiceHref: string;
  total: string; // formatted with ₹
  products: OrderItemUI[];
  raw?: unknown;
};

/* ----- Helpers (no `any`, no `??`) ----- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object";

const toStringSafe = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const toNumberOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const formatCurrencyRupee = (amt: number | null): string => {
  if (amt === null || Number.isNaN(amt)) return "₹0.00";
  return `₹${amt.toFixed(2)}`;
};

const formatDateHuman = (v: unknown): string => {
  const s = toStringSafe(v);
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
};

const toIsoDateOnly = (v: unknown): string => {
  const s = toStringSafe(v);
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

export default function OrderHistory(): React.ReactElement {
  const [orders, setOrders] = useState<OrderUI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function fetchOrders(): Promise<void> {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/order", { credentials: "include" });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const errMsg =
            isObject(errBody) && typeof (errBody as Record<string, unknown>).error === "string"
              ? ((errBody as Record<string, unknown>).error as string)
              : `HTTP ${res.status}`;
          throw new Error(errMsg);
        }

        const data = await res.json().catch(() => null);

        // Normalize response into array of raw orders
        let rawOrders: unknown[] = [];
        if (Array.isArray(data)) {
          rawOrders = data;
        } else if (isObject(data)) {
          // prefer data.orders if present and array
          if ("orders" in data && Array.isArray((data as Record<string, unknown>).orders)) {
            rawOrders = (data as Record<string, unknown>).orders as unknown[];
          } else if ("order" in data && isObject((data as Record<string, unknown>).order)) {
            rawOrders = [(data as Record<string, unknown>).order as unknown];
          } else if ("items" in data || "orderId" in data || "_id" in data || "number" in data) {
            rawOrders = [data];
          } else {
            rawOrders = [];
          }
        } else {
          rawOrders = [];
        }

        // Map raw orders to UI shape WITHOUT using ?? operator
        const mapped: OrderUI[] = rawOrders.map((ordRaw, orderIdx) => {
          const ord = isObject(ordRaw) ? ordRaw : {};

          // pick order id (explicit checks; no ??)
          let idCandidate: unknown = ord.orderId;
          if (idCandidate === undefined) idCandidate = ord._id;
          if (idCandidate === undefined) idCandidate = ord.number;
          if (idCandidate === undefined) idCandidate = `order-${orderIdx}`;
          const id = toStringSafe(idCandidate);

          // pick createdAt/date
          let createdAt: unknown = ord.createdAt;
          if (createdAt === undefined) createdAt = ord.created;
          if (createdAt === undefined) createdAt = ord.date;
          const dateHuman = formatDateHuman(createdAt);
          const datetime = toIsoDateOnly(createdAt ?? ord.datetime ?? null);

          // total numeric (try explicit fallbacks)
          let totalCandidate: unknown = ord.total;
          if (totalCandidate === undefined) totalCandidate = ord.grandTotal;
          if (totalCandidate === undefined) totalCandidate = ord.amount;
          if (totalCandidate === undefined) totalCandidate = ord.subtotal;
          const totalNum = toNumberOrNull(totalCandidate) ?? 0;
          const totalStr = formatCurrencyRupee(totalNum);

          // items/products array - explicit checks for arrays
          let rawItems: unknown[] = [];
          if (Array.isArray(ord.items)) rawItems = ord.items as unknown[];
          else if (Array.isArray(ord.products)) rawItems = ord.products as unknown[];
          else rawItems = [];

          const products: OrderItemUI[] = rawItems.map((itRaw, idx) => {
            const it = isObject(itRaw) ? itRaw : {};

            // populated product object (productId may be object) or item-level fields
            const populated = isObject(it.productId) ? (it.productId as Record<string, unknown>) : null;

            // id
            const pidCandidate: unknown = populated?._id ?? it.productId ?? it.id ?? `p-${idx}`;
            const pid = toStringSafe(pidCandidate);

            // name
            let nameCandidate: unknown = populated?.name;
            if (nameCandidate === undefined) nameCandidate = it.name ?? it.productName ?? "Product";
            const name = toStringSafe(nameCandidate);

            // href
            const href = `/products/${toStringSafe(populated?._id ?? it.productId ?? pid)}` || "#";

            // image src (explicit selection)
            let imageCandidate: unknown = undefined;
            if (populated && Array.isArray(populated.images) && populated.images.length > 0) {
              imageCandidate = populated.images[0];
            } else if (it.image !== undefined) imageCandidate = it.image;
            else if (it.imageSrc !== undefined) imageCandidate = it.imageSrc;
            else if (it.imageUrl !== undefined) imageCandidate = it.imageUrl;
            const imageSrc = toStringSafe(imageCandidate) || "/placeholder.png";

            // image alt
            const imageAlt = toStringSafe(it.imageAlt ?? populated?.name ?? name);

            // price
            let priceCandidate: unknown = it.price;
            if (priceCandidate === undefined && populated) priceCandidate = populated.price;
            if (priceCandidate === undefined) priceCandidate = it.total;
            const priceNum = toNumberOrNull(priceCandidate) ?? 0;
            const priceStr = formatCurrencyRupee(priceNum);

            // status
            let status = toStringSafe(it.status ?? ord.status ?? "");
            if (!status && toStringSafe(ord.status).toLowerCase() === "delivered") {
              const deliveredAt = ord.deliveredAt ?? ord.delivered ?? null;
              const deliveredStr = formatDateHuman(deliveredAt);
              status = deliveredStr ? `Delivered ${deliveredStr}` : "Delivered";
            }

            return {
              id: pid,
              name,
              href,
              price: priceStr,
              status,
              imageSrc,
              imageAlt,
            };
          });

          return {
            number: id,
            date: dateHuman || toStringSafe(ord.date ?? ord.datetime ?? ""),
            datetime,
            invoiceHref: `/ordersHistory/${id}`,
            total: totalStr,
            products,
            raw: ordRaw,
          } as OrderUI;
        });

        if (mounted) setOrders(mapped);
      } catch (err) {
        console.error("fetchOrders error:", err);
        if (mounted) setError(err instanceof Error ? err.message : toStringSafe(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, []);

  // Render states (same as before)
  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="text-center py-20 text-gray-600">Loading orders…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="text-center py-20 text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="text-center py-20 text-gray-600">No orders found.</div>
        </div>
      </div>
    );
  }

  // UI (preserves your markup)
  return (
    <div className="bg-white"> 
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Order history</h1>
          <p className="mt-2 text-sm text-gray-500">Check the status of recent orders, manage returns, and view order summaries.</p>
        </div>

        <div className="mt-16">
          <h2 className="sr-only">Recent orders</h2>

          <div className="space-y-20">
            {orders.map((order) => (
              <div key={order.number}>
                <h3 className="sr-only">
                  Order placed on <time dateTime={order.datetime}>{order.date}</time>
                </h3>

                <div className="rounded-lg bg-gray-50 px-4 py-6 sm:flex sm:items-center sm:justify-between sm:space-x-6 sm:px-6 lg:space-x-8">
                  <dl className="flex-auto divide-y divide-gray-200 text-sm text-gray-600 sm:grid sm:grid-cols-3 sm:gap-x-6 sm:divide-y-0 lg:w-1/2 lg:flex-none lg:gap-x-8">
                    <div className="max-sm:flex max-sm:justify-between max-sm:py-6 max-sm:first:pt-0 max-sm:last:pb-0">
                      <dt className="font-medium text-gray-900">Date placed</dt>
                      <dd className="sm:mt-1">
                        <time dateTime={order.datetime}>{order.date}</time>
                      </dd>
                    </div>
                    <div className="max-sm:flex max-sm:justify-between max-sm:py-6 max-sm:first:pt-0 max-sm:last:pb-0">
                      <dt className="font-medium text-gray-900">Order ID</dt>
                      <dd className="sm:mt-1">{order.number}</dd>
                    </div>
                    <div className="max-sm:flex max-sm:justify-between max-sm:py-6 max-sm:first:pt-0 max-sm:last:pb-0">
                      <dt className="font-medium text-gray-900">Total amount</dt>
                      <dd className="font-medium text-gray-900 sm:mt-1">{order.total}</dd>
                    </div>
                  </dl>

                  <Link
                    href={order.invoiceHref}
                    className="mt-6 flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden sm:mt-0 sm:w-auto"
                  >
                    Order Summary
                    <span className="sr-only"> for order {order.number}</span>
                  </Link>
                </div>

                <table className="mt-4 w-full text-gray-500 sm:mt-6">
                  <caption className="sr-only">Products</caption>
                  <thead className="sr-only text-left text-sm text-gray-500 sm:not-sr-only">
                    <tr>
                      <th scope="col" className="py-3 pr-8 font-normal sm:w-2/5 lg:w-1/3">Product</th>
                      <th scope="col" className="hidden w-1/5 py-3 pr-8 font-normal sm:table-cell">Price</th>
                      <th scope="col" className="hidden py-3 pr-8 font-normal sm:table-cell">Status</th>
                      <th scope="col" className="w-0 py-3 text-right font-normal">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 border-b border-gray-200 text-sm sm:border-t">
                    {order.products.map((product) => (
                      <tr key={product.id}>
                        <td className="py-6 pr-8">
                          <div className="flex items-center">
                            <Image
                              height={500}
                              width={500}
                              alt={product.imageAlt ?? product.name}
                              src={product.imageSrc ?? "/placeholder.png"}
                              className="mr-6 size-16 rounded-sm object-cover"
                              unoptimized
                            />
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="mt-1 sm:hidden">{product.price}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden py-6 pr-8 sm:table-cell">{product.price}</td>
                        <td className="hidden py-6 pr-8 sm:table-cell">{product.status}</td>
                        <td className="py-6 text-right font-medium whitespace-nowrap">
                          <Link href={product.href} className="text-indigo-600">
                            View
                            <span className="hidden lg:inline"> Product</span>
                            <span className="sr-only">, {product.name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
