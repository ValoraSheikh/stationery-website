"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrashIcon } from "@heroicons/react/24/outline";

type WishlistProduct = {
  productId: string;
  name?: string | null;
  price?: number | null;
  image?: string | null;
  addedAt?: string | null;
};

const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

export default function WishlistPage() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // per-item deleting state and errors
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const fetchWishlist = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/wishlist", {
          credentials: "same-origin",
          signal: ac.signal,
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Please log in to view your wishlist");
          }
          const text = await res.text().catch(() => "");
          throw new Error(`API error ${res.status} ${text}`);
        }

        const data = await res.json();
        const items: WishlistProduct[] = Array.isArray(data.products)
          ? data.products
          : [];

        if (mounted) setProducts(items);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWishlist();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  const handleDelete = async (productId: string) => {
    // clear previous item error
    setItemErrors((s) => {
      const copy = { ...s };
      delete copy[productId];
      return copy;
    });

    // mark deleting
    setDeletingIds((s) => new Set(s).add(productId));
    try {
      // call DELETE endpoint. Some implementations use the id in the path and still expect body,
      // so we provide both (path + body) to be compatible with your server code.
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please log in to modify your wishlist");
        }
        const text = await res.text().catch(() => "");
        // try parse json message
        let parsedMessage = "";
        try {
          const json = await res.json();
          parsedMessage = json?.message || "";
        } catch {
          parsedMessage = text;
        }
        throw new Error(parsedMessage || `Failed to delete (status ${res.status})`);
      }

      // success — remove from local state
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch (err: unknown) {
      setItemErrors((s) => ({
        ...s,
        [productId]: err instanceof Error ? err.message : "Failed to remove item",
      }));
    } finally {
      setDeletingIds((s) => {
        const copy = new Set(s);
        copy.delete(productId);
        return copy;
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-manrope font-bold text-4xl text-black mb-8 max-lg:text-center">
            Product Wishlist
          </h2>

          {loading ? (
            <p className="text-center text-gray-500">Loading wishlist…</p>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">Your wishlist is empty.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((p) => {
                const isDeleting = deletingIds.has(p.productId);
                return (
                  <div
                    key={p.productId}
                    className="mx-auto group lg:mx-auto bg-white transition-all duration-500 relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md"
                  >
                    {/* Delete button (top-right) */}
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (!isDeleting) handleDelete(p.productId);
                        }}
                        disabled={isDeleting}
                        aria-label="Remove from wishlist"
                        className={`flex items-center justify-center rounded-full p-2 bg-white/90 backdrop-blur shadow hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                          isDeleting ? "opacity-60 pointer-events-none" : ""
                        }`}
                        title="Remove"
                      >
                        {isDeleting ? (
                          // simple spinner
                          <svg
                            className="h-5 w-5 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                        ) : (
                          <TrashIcon className="h-5 w-5 text-gray-600 hover:text-red-600" />
                        )}
                      </button>
                    </div>

                    {/* clickable area */}
                    <Link
                      href={`/products/${p.productId}`}
                      className="block cursor-pointer"
                      onClick={(e) => {
                        /* no-op: keep link behavior (the delete button stops propagation) */
                      }}
                    >
                      <div>
                        <Image
                          height={500}
                          width={500}
                          src={p.image || PLACEHOLDER}
                          alt={p.name || "Product image"}
                          className="w-full aspect-square object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h6 className="font-semibold text-xl leading-8 text-black transition-all duration-500 group-hover:text-gray-600">
                            {p.name || "Untitled product"}
                          </h6>
                          <h6 className="font-semibold text-xl leading-8 text-gray-600">
                            {typeof p.price === "number" ? `₹${p.price}` : "—"}
                          </h6>
                        </div>

                        <p className="mt-2 font-normal text-sm leading-6 text-gray-500">
                          {p.addedAt ? new Date(p.addedAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </Link>

                    {/* per-item error shown under card */}
                    {itemErrors[p.productId] && (
                      <p className="px-4 pb-4 text-sm text-red-600">
                        {itemErrors[p.productId]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
