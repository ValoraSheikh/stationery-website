"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
              {products.map((p) => (
                <Link
                  key={p.productId}
                  href={`/products/${p.productId}`}
                  className="mx-auto group cursor-pointer lg:mx-auto bg-white transition-all duration-500"
                >
                  <div>
                    <Image
                      height={500}
                      width={500}
                      src={p.image || PLACEHOLDER}
                      alt={p.name || "Product image"}
                      className="w-full aspect-square rounded-2xl object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <h6 className="font-semibold text-xl leading-8 text-black transition-all duration-500 group-hover:text-gray-600">
                        {p.name || "Untitled product"}
                      </h6>
                      <h6 className="font-semibold text-xl leading-8 text-gray-600">
                        {typeof p.price === "number" ? `₹${p.price}` : "—"}
                      </h6>
                    </div>
                    {/* optional subtitle if you have anything; kept empty to match original layout */}
                    <p className="mt-2 font-normal text-sm leading-6 text-gray-500">
                      {/* show added date if available */}
                      {p.addedAt
                        ? new Date(p.addedAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
