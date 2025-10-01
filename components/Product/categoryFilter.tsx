"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Products from "./ProductList";
import { useSearchParams } from "next/navigation";

const sortOptions = [
  { name: "Price High to Low", key: "price-desc" },
  { name: "Price Low to High", key: "price-asc" },
  { name: "Best Rating", key: "rating-desc" },
];
const filters = [
  {
    id: "pages",
    name: "Pages",
    options: [
      { value: "240", label: "240" },
      { value: "300", label: "300" },
      { value: "400+", label: "400+" },
    ],
  },
];

interface ApiProductVariant {
  pageType: "ruled" | "plain" | "grid" | "dotted";
  quantity: number;
  color: string;
  additionalPrice: number;
}

interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  variants?: ApiProductVariant[];
}

// UI Product shape expected by ProductList
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

// Internal simplified product shape (keeps numeric price & variant quantities)
interface InternalProduct {
  id: string;
  name: string;
  minPrice: number;
  displayPrice: string;
  rating: number;
  reviewCount: number;
  imageSrc: string;
  imageAlt: string;
  href: string;
  quantities: number[]; // variant quantities (pages)
}

const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

export default function CategoryFilter() {
  const [open, setOpen] = useState(false);

  // fetch state
  const searchParams = useSearchParams();
  const category = searchParams?.get("category");

  // raw fetched internal products (with numbers)
  const [rawProducts, setRawProducts] = useState<InternalProduct[]>([]);
  // visible products formatted for ProductList
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters / sort state
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>("");

  // fetch products from API for the category
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setRawProducts([]);
    setProducts([]);

    // guard: require category query param
    if (!category) {
      // set an error and stop
      if (mounted) {
        setError("Category query is required");
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `/api/products?category=${encodeURIComponent(category ?? "")}`
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API error ${res.status} ${txt}`);
        }

        const data: { products: ApiProduct[] } = await res.json();

        const mapped: Product[] = Array.isArray(data.products)
          ? data.products.map((p: ApiProduct, idx: number) => {
              let displayPrice: number = p.price;

              if (p.variants && p.variants.length > 0) {
                const adds = p.variants.map(
                  (v: ApiProductVariant) => v.additionalPrice || 0
                );
                const minAdd = Math.min(...adds);
                displayPrice = p.price + minAdd;
              }

              const priceStr = `₹${displayPrice}`;

              return {
                id: p._id ?? `prod-${idx}`,
                name: p.name ?? "Untitled",
                price: priceStr,
                rating: 4,
                reviewCount: 0,
                imageSrc:
                  (p.images && p.images[0]) ||
                  "https://via.placeholder.com/600x600?text=No+Image",
                imageAlt: p.name ?? "Product image",
                href: `/products/${p._id ?? ""}`,
              };
            })
          : [];

        if (mounted) {
          setProducts(mapped);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Fetch products error:", err);
        if (mounted) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch products";
          setError(message);
          setProducts([]);
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [category]);

  // Apply filters + sorting whenever rawProducts, selectedPages or sortKey changes.
  useEffect(() => {
    // start from raw list
    let list = [...rawProducts];

    // pages filter
    if (selectedPages.length > 0) {
      list = list.filter((prod) => {
        // if product has no variant quantities, exclude it when filtering by pages
        if (!prod.quantities || prod.quantities.length === 0) return false;

        // product matches if any variant quantity satisfies any selectedPages rule
        return prod.quantities.some((q) =>
          selectedPages.some((sel) => {
            if (sel === "400+") return q >= 400;
            return String(q) === sel;
          })
        );
      });
    }

    // sorting
    if (sortKey === "price-asc") {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortKey === "price-desc") {
      list.sort((a, b) => b.minPrice - a.minPrice);
    } else if (sortKey === "rating-desc") {
      list.sort((a, b) => b.rating - a.rating);
    }

    // map to UI product shape expected by ProductList
    const mappedProducts: Product[] = list.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.displayPrice,
      rating: p.rating,
      reviewCount: p.reviewCount,
      imageSrc: p.imageSrc,
      imageAlt: p.imageAlt,
      href: p.href,
    }));

    setProducts(mappedProducts);
  }, [rawProducts, selectedPages, sortKey]);

  // checkbox change handler (used for both desktop and mobile checkboxes)
  const handlePageCheckbox = (value: string, checked: boolean) => {
    setSelectedPages((prev) => {
      if (checked) {
        // add if not present
        if (prev.includes(value)) return prev;
        return [...prev, value];
      } else {
        // remove
        return prev.filter((v) => v !== value);
      }
    });
  };

  // sort change handler (headlessui Menu items will call this)
  const handleSortChange = (key: string) => {
    setSortKey(key);
  };

  return (
    <div className="bg-gray-50">
      {/* Mobile filter dialog */}
      <Dialog open={open} onClose={setOpen} className="relative z-40 sm:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative ml-auto flex size-full max-w-xs transform flex-col overflow-y-auto bg-white pt-4 pb-6 shadow-xl transition duration-300 ease-in-out data-closed:translate-x-full"
          >
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            {/* Filters */}
            <form className="mt-4">
              {filters.map((section) => (
                <Disclosure
                  key={section.name}
                  as="div"
                  className="border-t border-gray-200 px-4 py-6"
                >
                  <h3 className="-mx-2 -my-3 flow-root">
                    <DisclosureButton className="group flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400">
                      <span className="font-medium text-gray-900">
                        {section.name}
                      </span>
                      <span className="ml-6 flex items-center">
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-5 rotate-0 transform group-data-open:-rotate-180"
                        />
                      </span>
                    </DisclosureButton>
                  </h3>
                  <DisclosurePanel className="pt-6">
                    <div className="space-y-6">
                      {section.options.map((option, optionIdx) => (
                        <div key={option.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                defaultValue={option.value}
                                id={`filter-mobile-${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                type="checkbox"
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                checked={selectedPages.includes(option.value)}
                                onChange={(e) =>
                                  handlePageCheckbox(
                                    option.value,
                                    e.target.checked
                                  )
                                }
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                              >
                                <path
                                  d="M3 8L6 11L11 3.5"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="opacity-0 group-has-checked:opacity-100"
                                />
                                <path
                                  d="M3 7H11"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="opacity-0 group-has-indeterminate:opacity-100"
                                />
                              </svg>
                            </div>
                          </div>
                          <label
                            htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                            className="text-sm text-gray-500"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DisclosurePanel>
                </Disclosure>
              ))}
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="py-24">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {category}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-gray-500">
            Thoughtfully designed objects for the workspace, home, and travel.
          </p>
        </div>

        <section
          aria-labelledby="filter-heading"
          className="border-t border-gray-200 py-6"
        >
          <h2 id="filter-heading" className="sr-only">
            Product filters
          </h2>

          <div className="flex items-center justify-between">
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                Sort
                <ChevronDownIcon
                  aria-hidden="true"
                  className="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
                />
              </MenuButton>

              <MenuItems
                transition
                className="absolute left-0 z-10 mt-2 w-40 origin-top-left rounded-md bg-white shadow-2xl ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <MenuItem key={option.key}>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSortChange(option.key);
                          }}
                          className="block px-4 py-2 text-sm font-medium text-gray-900 data-focus:bg-gray-100 data-focus:outline-hidden w-full text-left"
                        >
                          {option.name}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-block text-sm font-medium text-gray-700 hover:text-gray-900 sm:hidden"
            >
              Filters
            </button>

            <PopoverGroup className="hidden sm:flex sm:items-baseline sm:space-x-8">
              {filters.map((section, sectionIdx) => (
                <Popover
                  key={section.name}
                  className="relative inline-block text-left"
                >
                  <div>
                    <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                      <span>{section.name}</span>
                      {sectionIdx === 0 ? (
                        <span className="ml-1.5 rounded-sm bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-700 tabular-nums">
                          {selectedPages.length || 0}
                        </span>
                      ) : null}
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
                      />
                    </PopoverButton>
                  </div>

                  <PopoverPanel
                    transition
                    className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    <form className="space-y-4">
                      {section.options.map((option, optionIdx) => (
                        <div key={option.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                defaultValue={option.value}
                                id={`filter-${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                type="checkbox"
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                checked={selectedPages.includes(option.value)}
                                onChange={(e) =>
                                  handlePageCheckbox(
                                    option.value,
                                    e.target.checked
                                  )
                                }
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                              >
                                <path
                                  d="M3 8L6 11L11 3.5"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="opacity-0 group-has-checked:opacity-100"
                                />
                                <path
                                  d="M3 7H11"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="opacity-0 group-has-indeterminate:opacity-100"
                                />
                              </svg>
                            </div>
                          </div>
                          <label
                            htmlFor={`filter-${section.id}-${optionIdx}`}
                            className="pr-6 text-sm font-medium whitespace-nowrap text-gray-900"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </form>
                  </PopoverPanel>
                </Popover>
              ))}
            </PopoverGroup>
          </div>
        </section>
      </div>

      {/* pass fetched products + loading + error into Products */}
      <Products products={products} loading={loading} error={error} />
    </div>
  );
}
