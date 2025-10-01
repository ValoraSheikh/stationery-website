// app/cart/page.tsx  (replace your existing file content with this)
"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
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
  variantSku?: string; // IMPORTANT: GET /api/cart should include this for deletes
}

export default function page() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const PLACEHOLDER =
    "https://via.placeholder.com/500x500?text=No+Image";

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", { credentials: "same-origin" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || `Failed to load cart (status ${res.status})`);
        setItems([]);
      } else {
        // expect data.items = [{ productId, name, images, basePrice, quantity, priceAtAdd, subtotal, variantSku? }, ...]
        setItems(Array.isArray(data?.items) ? data.items : []);
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Remove item from cart
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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || `Failed to remove item (status ${res.status})`);
        return;
      }

      // remove locally so UI updates immediately
      setItems((prev) =>
        prev.filter(
          (it) => !(it.productId === item.productId && it.variantSku === item.variantSku)
        )
      );
    } catch (err: any) {
      setError(err?.message || "Network error while removing item");
    } finally {
      setRemovingKey(null);
    }
  }

  // computed totals (rupees)
  const subtotal = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const shipping = subtotal > 0 && subtotal < 599 ? 49 : 0; // your rule
  const orderTotal = subtotal + shipping;

  // small helper to format rupee without decimals (matches product page style)
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

            {/* show a small loading / error message above list */}
            {loading && (
              <p className="text-sm text-gray-600 mb-4">Loading cart…</p>
            )}
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
                const key = `${product.productId}-${product.variantSku ?? productIdx}`;

                // estimate inStock: we don't have stock info from GET api; assume in stock if quantity > 0
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

                            {/* original markup used color/size; these fields are not present in GET response.
                                keep the elements but render nothing when data is unavailable to preserve layout */}
                            <p className="mt-1 text-sm text-gray-500">
                              {/* color — not provided by cart GET */}
                              {("" as string)}
                            </p>
                            {false ? (
                              <p className="mt-1 text-sm text-gray-500">{""}</p>
                            ) : null}
                          </div>

                          <p className="text-right text-sm font-medium text-gray-900">
                            {fmt(product.priceAtAdd ?? product.basePrice)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center sm:absolute sm:top-0 sm:left-1/2 sm:mt-0 sm:block">
                          <div className="inline-grid w-full max-w-16 grid-cols-1">
                            <select
                              name={`quantity-${productIdx}`}
                              aria-label={`Quantity, ${product.name}`}
                              defaultValue={String(product.quantity)}
                              className="col-start-1 row-start-1 appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                              <option value={6}>6</option>
                              <option value={7}>7</option>
                              <option value={8}>8</option>
                            </select>
                            <ChevronDownIcon
                              aria-hidden="true"
                              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(product)}
                            disabled={removingKey === `${product.productId}:${product.variantSku}`}
                            className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:mt-3 sm:ml-0"
                          >
                            <span>
                              {removingKey === `${product.productId}`
                                ? "Removing..."
                                : "Remove"}
                            </span>
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

                        <span>
                          {inStock ? "In stock" : `Ships soon`}
                        </span>
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

                  {/* shipping row: applies your rule */}
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-gray-600">Shipping</dt>
                    <dd className="font-medium text-gray-900">
                      {shipping === 0 ? "Free" : fmt(shipping)}
                    </dd>
                  </div>

                  {/* removed Tax row (per your instruction) */}

                  <div className="flex items-center justify-between py-4">
                    <dt className="text-base font-medium text-gray-900">
                      Order total
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      {fmt(orderTotal)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-10">
              <button
                type="submit"
                className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden"
              >
                <Link href="checkout">Checkout</Link>
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
