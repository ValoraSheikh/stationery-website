/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ClockIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";

interface CartItem {
  productId: string;
  name: string;
  images: string[];
  basePrice: number;
  quantity: number;
  priceAtAdd: number;
  subtotal: number;
  variantSku?: string;
}

export default function page() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const PLACEHOLDER = "https://via.placeholder.com/500x500?text=No+Image";

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", { credentials: "same-origin" });
      const data: { items?: CartItem[]; message?: string } = await res.json();
      if (!res.ok) {
        setError(data?.message || `Failed to load cart (status ${res.status})`);
        setItems([]);
      } else {
        const loadedItems = Array.isArray(data?.items) ? data.items : [];
        // compute subtotal per item
        setItems(
          loadedItems.map((it) => ({
            ...it,
            subtotal: (it.priceAtAdd ?? it.basePrice) * it.quantity,
          }))
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Network error while loading cart"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(item: CartItem) {
    setError(null);

    if (!item.productId) {
      setError("Missing productId for item");
      return;
    }

    const key = `${item.productId}`;
    setRemovingKey(key);

    try {
      const res = await fetch(`/api/cart/${item.productId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          variantSku: item.variantSku,
        }),
      });

      const data: { message?: string } = await res.json();

      if (!res.ok) {
        setError(data?.message || `Failed to remove item (status ${res.status})`);
        return;
      }

      setItems((prev) =>
        prev.filter(
          (it) =>
            !(it.productId === item.productId && it.variantSku === item.variantSku)
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Network error while removing item"
      );
    } finally {
      setRemovingKey(null);
    }
  }

  async function handleUpdateQuantity(item: CartItem, newQty: number) {
    if (newQty <= 0) return;

    const key = `${item.productId}`;
    setUpdatingKey(key);

    try {
      const res = await fetch(`/api/cart/${item.productId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, quantity: newQty }),
      });

      const data: { message?: string; cart?: { items?: CartItem[] } } =
        await res.json();

      if (!res.ok) {
        setError(data?.message || `Failed to update quantity (status ${res.status})`);
        return;
      }

      // update locally: quantity and subtotal
      setItems((prev) =>
        prev.map((it) =>
          it.productId === item.productId
            ? {
                ...it,
                quantity: newQty,
                subtotal: (it.priceAtAdd ?? it.basePrice) * newQty,
              }
            : it
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Network error while updating quantity"
      );
    } finally {
      setUpdatingKey(null);
    }
  }

  // compute totals dynamically
  const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
  const shipping = subtotal > 0 && subtotal < 599 ? 49 : 0;
  const orderTotal = subtotal + shipping;
  const fmt = (n: number) => `₹${Math.round(n)}`;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Shopping Cart
        </h1>

        <form className="mt-12">
          <div>
            <h2 className="sr-only">Items in your shopping cart</h2>

            {loading && <p className="text-sm text-gray-600 mb-4">Loading cart…</p>}
            {error && (
              <p className="text-sm text-red-600 mb-4" role="alert">
                {error}
              </p>
            )}

            <ul
              role="list"
              className="divide-y divide-gray-200 border-t border-b border-gray-200"
            >
              {items.length === 0 && !loading ? (
                <li className="flex py-6 sm:py-10">
                  <div className="ml-4 flex flex-1 flex-col">
                    <p className="text-sm text-gray-700">Your cart is empty.</p>
                    <div className="mt-4">
                      <Link
                        href="/products"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Continue Shopping &rarr;
                      </Link>
                    </div>
                  </div>
                </li>
              ) : null}

              {items.map((product, productIdx) => {
                const imageSrc =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : PLACEHOLDER;
                const key = `${product.productId}-${productIdx}`;
                const inStock = product.quantity > 0;

                return (
                  <li key={key} className="flex py-6 sm:py-10">
                    <div className="shrink-0">
                      <Image
                        height={500}
                        width={500}
                        alt={product.name}
                        src={imageSrc}
                        className="size-24 rounded-lg object-cover sm:size-32"
                      />
                    </div>

                    <div className="relative ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div>
                        <div className="flex justify-between sm:grid sm:grid-cols-2">
                          <div className="pr-6">
                            <h3 className="text-sm">
                              <Link
                                href={`/products/${product.productId}`}
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {product.name}
                              </Link>
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">{""}</p>
                          </div>

                          <p className="text-right text-sm font-medium text-gray-900">
                            {fmt(product.subtotal)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center sm:absolute sm:top-0 sm:left-1/2 sm:mt-0 sm:flex-col sm:items-start">
                          <div
                            className="py-2 px-3 inline-block bg-white border border-gray-200 rounded-lg"
                            data-hs-input-number=""
                          >
                            <div className="flex items-center gap-x-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(product, product.quantity - 1)
                                }
                                disabled={updatingKey === product.productId || product.quantity <= 1}
                                className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50"
                                aria-label="Decrease"
                              >
                                <svg
                                  className="shrink-0 size-3.5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M5 12h14"></path>
                                </svg>
                              </button>
                              <input
                                className="p-0 w-6 bg-transparent border-0 text-gray-800 text-center focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                type="number"
                                aria-roledescription="Number field"
                                value={product.quantity}
                                data-hs-input-number-input=""
                                readOnly
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(product, product.quantity + 1)
                                }
                                disabled={updatingKey === product.productId}
                                className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50"
                                aria-label="Increase"
                              >
                                <svg
                                  className="shrink-0 size-3.5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M5 12h14"></path>
                                  <path d="M12 5v14"></path>
                                </svg>
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(product)}
                            disabled={removingKey === product.productId}
                            className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:ml-0 sm:mt-3"
                          >
                            {removingKey === product.productId ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>

                      <p className="mt-4 flex space-x-2 text-sm text-gray-700">
                        {inStock ? (
                          <CheckIcon
                            aria-hidden="true"
                            className="size-5 shrink-0 text-green-500"
                          />
                        ) : (
                          <ClockIcon
                            aria-hidden="true"
                            className="size-5 shrink-0 text-gray-300"
                          />
                        )}
                        <span>{inStock ? "In stock" : `Ships soon`}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Order summary */}
          <div className="mt-10 sm:ml-32 sm:pl-6">
            <div className="rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:p-8">
              <h2 className="sr-only">Order summary</h2>
              <div className="flow-root">
                <dl className="-my-4 divide-y divide-gray-200 text-sm">
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="font-medium text-gray-900">{fmt(subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-gray-600">Shipping</dt>
                    <dd className="font-medium text-gray-900">{shipping === 0 ? "🎉 Limited Time: Free Delivery – Grab Yours Now!" : fmt(shipping)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-base font-medium text-gray-900">Order total</dt>
                    <dd className="text-base font-medium text-gray-900">{fmt(orderTotal)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-10">
              <button
                type="submit"
                className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden"
              >
                <Link href="/checkout">Checkout</Link>
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                or{" "}
                <Link
                  href="products"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Continue Shopping
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
