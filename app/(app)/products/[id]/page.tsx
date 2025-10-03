"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { StarIcon } from "@heroicons/react/20/solid";
import { HeartIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReviewComponent from "@/components/Product/reviewCompoenet";
import Reviews from "@/components/Product/Reviews";
import { useReviewSummary } from "@/hooks/useReviewSummary";

// helper
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// Variant type
interface Variant {
  pageType: "ruled" | "plain" | "grid" | "dotted";
  quantity: number;
  color: string;
  additionalPrice?: number;
  stock: number;
  sku: string;
}

// Product type from API
interface Product {
  _id: string;
  name: string;
  brandName: string;
  price: number;
  images: string[];
  description: string;
  variants: Variant[];
  totalStock: number;
  minStockAlert?: number;
  specifications: {
    size: string;
    binding: string;
    paperGsm: number;
    coverType: string;
    ruled?: { lineSpacing: string; marginLeft: boolean };
  };
  productCode: string;
  rating?: number;
}

// Placeholder if no images
const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const params = useParams();
  const productId = params?.id;

  const { averageRating, reviewCount } = useReviewSummary(productId as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-to-cart related states
  const [isAdding, setIsAdding] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [addToCartSuccess, setAddToCartSuccess] = useState<string | null>(null);

  // Wishlist (favorite) related states
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [favoriteSuccess, setFavoriteSuccess] = useState<string | null>(null);

  // Toggle add-to-wishlist (POST /api/wishlist)
  const handleToggleWishlist = async () => {
    setFavoriteError(null);
    setFavoriteSuccess(null);

    if (!product) {
      setFavoriteError("Product not loaded");
      return;
    }

    setIsFavoriting(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId: product._id }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        /* ignore parse error */
      }

      if (res.status === 201) {
        setIsInWishlist(true);
        setFavoriteSuccess(data?.message || "Product added to wishlist");
      } else if (res.status === 200) {
        // API returns 200 when "already in wishlist"
        setIsInWishlist(true);
        setFavoriteSuccess(data?.message || "Product already in wishlist");
      } else if (res.status === 401) {
        setFavoriteError(data?.message || "Please log in to add to wishlist");
      } else if (res.status >= 400) {
        setFavoriteError(
          data?.message || `Failed to add to wishlist (status ${res.status})`
        );
      } else {
        setFavoriteSuccess(data?.message || "Wishlist updated");
      }
    } catch (err: unknown) {
      setFavoriteError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsFavoriting(false);
    }
  };

  useEffect(() => {
    if (!productId) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`API error ${res.status} ${text}`);
        }
        const data: { product: Product } = await res.json();
        if (mounted) {
          setProduct(data.product);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch product"
          );
          setLoading(false);
        }
      }
    };

    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [productId]);

  if (loading)
    return (
      <div className="py-6 text-center text-sm text-gray-600 bg-white">
        Loading product details…
      </div>
    );

  if (error)
    return (
      <div className="py-6 text-center text-sm text-red-600">
        Error: {error}
      </div>
    );

  if (!product)
    return (
      <div className="py-6 text-center text-sm text-gray-600">
        Product not found.
      </div>
    );

  const variant = product.variants[0];

  const images =
    product.images.length > 0
      ? product.images.map((src, idx) => ({ id: idx, src, alt: product.name }))
      : [{ id: 0, src: PLACEHOLDER, alt: "No image" }];

  const finalPrice = product.price + (variant?.additionalPrice || 0);

  const details = [
    {
      name: "Price & Stock",
      items: [
        `Price: ₹${finalPrice}`,
        product.totalStock > 0
          ? product.totalStock <= (product.minStockAlert || 5)
            ? `Only ${product.totalStock} left in stock!`
            : "In Stock"
          : "Out of Stock",
      ],
    },
    {
      name: "Specifications",
      items: [
        `Size: ${product.specifications.size}`,
        `Binding: ${product.specifications.binding}`,
        `Paper GSM: ${product.specifications.paperGsm}`,
        `Cover Type: ${product.specifications.coverType}`,
        product.specifications.ruled
          ? `Ruled: ${product.specifications.ruled.lineSpacing}, ${
              product.specifications.ruled.marginLeft
                ? "Left margin"
                : "No left margin"
            }`
          : "Ruled: N/A",
      ],
    },
    {
      name: "Variant Details",
      items: [
        `Page Type: ${variant?.pageType}`,
        `Pages: ${variant?.quantity}`,
        `Cover Color: ${variant?.color}`,
        `SKU: ${variant?.sku}`,
      ],
    },
    {
      name: "Product Code",
      items: [product.productCode],
    },
  ];

  // derived states
  const outOfStock = product.totalStock <= 0 || (variant && variant.stock <= 0);
  const exceedsStock = variant ? quantity > variant.stock : false;

  // Add to cart handler
  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddToCartError(null);
    setAddToCartSuccess(null);

    if (!product) {
      setAddToCartError("Product not loaded");
      return;
    }
    if (!variant) {
      setAddToCartError("Variant not selected");
      return;
    }
    if (outOfStock) {
      setAddToCartError("Product is out of stock");
      return;
    }
    if (quantity < 1) {
      setAddToCartError("Quantity must be at least 1");
      return;
    }
    if (exceedsStock) {
      setAddToCartError("Requested quantity exceeds available stock");
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          productId: product._id,
          variantSku: variant.sku,
          quantity,
        }),
      });

      // try to parse response JSON (if any)
      interface APIResponse {
        message?: string;
      }
      let data: APIResponse | null = null;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Failed to parse JSON response", err);
        // ignore JSON parse errors
      }

      if (!res.ok) {
        if (res.status === 401) {
          setAddToCartError(
            data?.message || "Please log in to add items to your cart"
          );
        } else {
          setAddToCartError(
            data?.message || `Failed to add to cart (status ${res.status})`
          );
        }
        setIsAdding(false);
        return;
      }

      setAddToCartSuccess(data?.message || "Product added to cart");

      // optionally you could update a global cart state or trigger a cart refresh here
    } catch (err: unknown) {
      setAddToCartError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 ">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            {/* Image gallery */}
            <TabGroup className="flex flex-col-reverse">
              <div className="mx-auto mt-6 w-full max-w-2xl sm:block lg:max-w-none">
                <TabList className="grid grid-cols-4 gap-6">
                  {images.map((image) => (
                    <Tab
                      key={image.id}
                      className="group relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium text-gray-900 uppercase hover:bg-gray-50 focus:ring-3 focus:ring-indigo-500/50 focus:ring-offset-4 focus:outline-hidden"
                    >
                      <span className="sr-only">{image.alt}</span>
                      <span className="absolute inset-0 overflow-hidden rounded-md">
                        <Image
                          height={500}
                          width={500}
                          alt=""
                          src={image.src}
                          className="size-full object-cover"
                        />
                      </span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-transparent ring-offset-2 group-data-selected:ring-indigo-500"
                      />
                    </Tab>
                  ))}
                </TabList>
              </div>

              <TabPanels>
                {images.map((image) => (
                  <TabPanel key={image.id}>
                    <Image
                      height={500}
                      width={500}
                      alt={image.alt}
                      src={image.src}
                      className="aspect-square w-full object-cover sm:rounded-lg"
                    />
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>

            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {product.name}
              </h1>

              <div className="mt-3">
                <h2 className="sr-only">Product information</h2>
                <p className="text-3xl tracking-tight text-gray-900">
                  ₹{finalPrice}
                </p>
              </div>

              {/* Reviews */}
              <div className="mt-3">
                <h3 className="sr-only">Reviews</h3>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <StarIcon
                        key={rating}
                        aria-hidden="true"
                        className={classNames(
                          (averageRating || 5) > rating
                            ? "text-yellow-300"
                            : "text-gray-300",
                          "size-5 shrink-0"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 pl-3.5">
                    {reviewCount || 0} Reviews
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="sr-only">Description</h3>
                <div
                  dangerouslySetInnerHTML={{ __html: product.description }}
                  className="space-y-6 text-base text-gray-700"
                />
              </div>

              {/* Quantity selector */}
              {/* Input Number with dynamic total */}
              <div className="py-2 px-3 my-5 bg-white lg:w-1/2 border border-gray-200 rounded-lg">
                <div className="w-full flex justify-between items-center gap-x-3">
                  <div>
                    <span className="block font-medium text-sm text-gray-800">
                      Quantity
                    </span>
                    <span className="block text-xs text-gray-500">
                      Total: ₹
                      {quantity *
                        ((product.variants[0]?.additionalPrice || 0) +
                          product.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-1.5">
                    <button
                      type="button"
                      className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                      tabIndex={-1}
                      aria-label="Decrease"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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
                      type="number"
                      aria-roledescription="Number field"
                      value={quantity}
                      min={1}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Number(e.target.value)))
                      }
                      className="p-0 w-6 bg-transparent border-0 text-gray-800 text-center focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      style={{ MozAppearance: "textfield" }}
                    />

                    <button
                      type="button"
                      className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                      tabIndex={-1}
                      aria-label="Increase"
                      onClick={() => setQuantity((q) => q + 1)}
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
              </div>
              {/* End Input Number */}

              {/* Add to bag / favorite */}
              <form className="mt-6" onSubmit={handleAddToCart}>
                <div className="mt-10 flex flex-col sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={isAdding || outOfStock || exceedsStock}
                    className="flex w-full sm:max-w-xs sm:flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden"
                  >
                    {isAdding ? "Adding..." : "Add to bag"}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    disabled={isFavoriting}
                    aria-pressed={isInWishlist}
                    className="mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto flex items-center justify-center rounded-md px-3 py-3 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <HeartIcon
                      aria-hidden="true"
                      className={`size-6 shrink-0 ${
                        isInWishlist ? "text-red-500" : ""
                      }`}
                    />
                    <span className="sr-only">
                      {isInWishlist ? "Added to favorites" : "Add to favorites"}
                    </span>
                  </button>
                </div>

                {/* Wishlist messages (placed under the buttons so they appear stacked on mobile) */}
                {favoriteError && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    {favoriteError}
                  </p>
                )}

                {favoriteSuccess && (
                  <p
                    className="mt-3 text-sm text-green-600"
                    role="status"
                    aria-live="polite"
                  >
                    {favoriteSuccess}
                  </p>
                )}

                {/* minimal messages, do not alter layout much */}
                {addToCartError && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    {addToCartError}
                  </p>
                )}

                {addToCartSuccess && (
                  <p
                    className="mt-3 text-sm text-green-600"
                    role="status"
                    aria-live="polite"
                  >
                    {addToCartSuccess}
                  </p>
                )}
              </form>

              {/* Additional details section */}
              <section aria-labelledby="details-heading" className="mt-12">
                <h2 id="details-heading" className="sr-only">
                  Additional details
                </h2>

                <div className="divide-y divide-gray-200 border-t border-gray-200">
                  {details.map((detail) => (
                    <Disclosure key={detail.name} as="div">
                      <h3>
                        <DisclosureButton className="group relative flex w-full items-center justify-between py-6 text-left">
                          <span className="text-sm font-medium text-gray-900 group-data-open:text-indigo-600">
                            {detail.name}
                          </span>
                          <span className="ml-6 flex items-center">
                            <PlusIcon
                              aria-hidden="true"
                              className="block size-6 text-gray-400 group-hover:text-gray-500 group-data-open:hidden"
                            />
                            <MinusIcon
                              aria-hidden="true"
                              className="hidden size-6 text-indigo-400 group-hover:text-indigo-500 group-data-open:block"
                            />
                          </span>
                        </DisclosureButton>
                      </h3>
                      <DisclosurePanel className="pb-6">
                        <ul
                          role="list"
                          className="list-disc space-y-1 pl-5 text-sm/6 text-gray-700 marker:text-gray-300"
                        >
                          {detail.items.map((item) => (
                            <li key={item} className="pl-2">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </DisclosurePanel>
                    </Disclosure>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div>
        <ReviewComponent productId={productId as string} />
      </div>

      <div className="bg-white">
        <Reviews productId={productId as string} />
      </div>
    </>
  );
}
