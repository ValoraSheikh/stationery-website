"use client";

import { StarIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// UI Product shape
interface Product {
  id: string;
  name: string;
  price: string; // price string with currency
  rating: number;
  reviewCount: number;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

interface ProductListProps {
  products?: Product[];
  loading?: boolean;
  error?: string | null;
}

// placeholder image
const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

export default function Example({
  products = [],
  loading = false,
  error = null,
}: ProductListProps) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl overflow-hidden sm:px-6 lg:px-8">
        <h2 className="sr-only">Products</h2>

        {loading && (
          <div className="py-6 text-center text-sm text-gray-600">Loading products…</div>
        )}
        {error && (
          <div className="py-6 text-center text-sm text-red-600">Error: {error}</div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-600">
            No products found in this category.
          </div>
        )}

        <div className="-mx-px grid grid-cols-2 border-l border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative border-r border-b border-gray-200 p-4 sm:p-6"
            >
              <Image
                height={500}
                width={500}
                alt={product.imageAlt}
                src={product.imageSrc || PLACEHOLDER}
                className="aspect-square rounded-lg bg-gray-200 object-cover group-hover:opacity-75"
              />
              <div className="pt-10 pb-4 text-center">
                <h3 className="text-sm font-medium text-gray-900">
                  <Link href={`products/${product.id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
                <div className="mt-3 flex flex-col items-center">
                  <p className="sr-only">{product.rating} out of 5 stars</p>
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <StarIcon
                        key={rating}
                        aria-hidden="true"
                        className={classNames(
                          product.rating > rating ? "text-yellow-400" : "text-gray-200",
                          "size-5 shrink-0"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {product.reviewCount} reviews
                  </p>
                </div>
                <p className="mt-4 text-base font-medium text-gray-900">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
