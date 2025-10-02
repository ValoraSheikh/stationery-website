/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { CheckCircleIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { z } from "zod";


// Placeholder image when product has no image (not a product fallback)
const PLACEHOLDER =
  "https://via.placeholder.com/600x600?text=No+Image";

// Types for cart API response items (matching your server mapping)
interface CartApiItem {
  productId: string;
  name: string;
  images: string[];
  basePrice: number;
  quantity: number;
  priceAtAdd: number;
  subtotal: number;
  variantSku?: string;
}

interface CartApiResponse {
  items: CartApiItem[];
  shippingCost?: number;
  taxAmount?: number;
  totalAmount?: number;
}

/* -----------------------
   Zod validation schema
   ----------------------- */
const phoneRegex = /^(\+91)?[6-9]\d{9}$/; // accepts +91 optional or just 10 digits starting 6-9
const pincodeRegex = /^\d{6}$/;

const shippingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid Indian phone number (10 digits, optionally +91)"),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email"),
  addressLine1: z.string().min(5, "Address line 1 must be at least 5 characters"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  pincode: z.string().regex(pincodeRegex, "Pincode must be 6 digits"),
  country: z.string().min(2, "Country is required").default("India"),
});

const checkoutSchema = z.object({
  contactEmail: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid contact email"),
  shipping: shippingSchema,
  paymentMethod: z.enum(["online", "cod"]),
});

type CheckoutSchema = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  // cart state
  const [cart, setCart] = useState<CartApiResponse | null>(null);
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  const [cartError, setCartError] = useState<string | null>(null);

  // shipping info state (fields exactly as required)
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // contact email (top section)
  const [contactEmail, setContactEmail] = useState("");

  // payment method state ('online' | 'cod')
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    "online"
  );

  // validation errors from zod mapped to simple keys
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    // fetch cart on mount
    const fetchCart = async () => {
      setCartLoading(true);
      try {
        const res = await fetch("/api/cart");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Cart fetch failed: ${res.status} ${text}`);
        }
        const data = (await res.json()) as CartApiResponse;
        setCart(data);
      } catch (err: unknown) {
        console.error(err);
        setCartError(err instanceof Error ? err.message : "Failed to fetch cart");
      } finally {
        setCartLoading(false);
      }
    };

    fetchCart();
  }, []);

  // helper: currency formatting
  const formatCurrency = (n: number) => `₹${n.toFixed(2)}`;

  // simple orderId generator (server should be authoritative)
  const generateOrderId = () => {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `ORD-${ts}-${rand}`.toUpperCase();
  };

  // validate + submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setErrors({});

    // build payload for zod parse
    const payload = {
      contactEmail: contactEmail?.trim() || undefined,
      shipping: {
        ...shipping,
        // ensure strings trimmed
        name: shipping.name.trim(),
        phone: shipping.phone.trim(),
        email: shipping.email?.trim(),
        addressLine1: shipping.addressLine1.trim(),
        addressLine2: shipping.addressLine2?.trim(),
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        pincode: shipping.pincode.trim(),
        country: shipping.country?.trim() || "India",
      },
      paymentMethod,
    };

    const result = checkoutSchema.safeParse(payload);

    if (!result.success) {
      // map zod errors to our errors state
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "form";
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      // scroll to first error
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) {
        const id = firstKey.replace("shipping.", "").replace("contactEmail", "email-address");
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // validation passed
    setSubmitting(true);
    try {
      // Ensure we have cart data (type-narrowing so TS knows later it's not null)
      let cartData: CartApiResponse | null = cart;
      if (!cartData) {
        const res = await fetch("/api/cart");
        if (!res.ok) throw new Error("Unable to fetch cart for checkout");
        const data = (await res.json()) as CartApiResponse;
        cartData = data;
        setCart(data);
      }

      if (!cartData || !cartData.items || cartData.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // Calculate subtotal from cart items (defensive)
      const subtotal = (cartData.items || []).reduce(
        (s, it) => s + (typeof it.subtotal === "number" ? it.subtotal : (it.priceAtAdd * it.quantity)),
        0
      );

      // Shipping rule: if subtotal < 599 => ₹49, else 0
      const shippingCost = subtotal < 599 ? 49 : 0;

      // tax from cart if provided, otherwise 0
      const taxAmount = cartData.taxAmount ?? 0;

      // discount (client currently none)
      const discount = 0;

      // grand total explicit calculation
      const grandTotal = subtotal + shippingCost + taxAmount - discount;

      // Prepare items for order model
      const items = (cartData.items || []).map((it) => ({
        productId: it.productId,
        variantSku: it.variantSku ?? undefined,
        name: it.name,
        quantity: it.quantity,
        price: it.priceAtAdd,
        total: it.subtotal,
      }));

      // Map paymentMethod to Order model enum
      const paymentMethodOrder = paymentMethod === "cod" ? "COD" : ("Card" as const);

      // Payment status: pending until payment processed
      const paymentStatus = "pending";

      const now = new Date();

      const order = {
        orderId: generateOrderId(),
        userId: null as null | string, // server should set from session
        status: "pending" as const,
        items,
        subtotal,
        shippingCost,
        taxAmount,
        discount,
        grandTotal,
        paymentMethod: paymentMethodOrder,
        paymentStatus,
        transactionId: undefined as string | undefined,
        shippingAddress: {
          name: payload.shipping.name,
          phone: payload.shipping.phone,
          email: payload.shipping.email || payload.contactEmail || undefined,
          addressLine1: payload.shipping.addressLine1,
          addressLine2: payload.shipping.addressLine2 || undefined,
          city: payload.shipping.city,
          state: payload.shipping.state,
          pincode: payload.shipping.pincode,
          country: payload.shipping.country || "India",
        },
        billingAddress: undefined as undefined | typeof shipping,
        expectedDelivery: undefined as Date | undefined,
        deliveredAt: undefined as Date | undefined,
        cancellationReason: undefined as string | undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Log assembled order
      // eslint-disable-next-line no-console
      console.log("=== ASSEMBLED ORDER OBJECT ===");
      console.log(order);

      setSubmitSuccess("Order object assembled and logged to console (see devtools).");

      // clear errors (if any)
      setErrors({});
      // scroll to top for feedback
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "Failed to assemble order");
    } finally {
      setSubmitting(false);
    }
  };

  // update shipping helper
  const updateShipping = (key: keyof typeof shipping, value: string) => {
    setShipping((s) => ({ ...s, [key]: value }));
    // clear error for this field if any
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`shipping.${key}`];
      return copy;
    });
  };

  // Products to render in summary — NO FALLBACK PRODUCTS
  const productsToRender =
    cart && cart.items && cart.items.length > 0
      ? cart.items.map((it) => ({
          id: String(it.productId),
          name: it.name,
          price: formatCurrency(it.subtotal),
          color: "", // not provided by cart
          size: `${it.quantity} pcs`,
          imageSrc: it.images?.[0] || PLACEHOLDER,
          imageAlt: it.name,
        }))
      : [];

  // Summary numbers computed from cart (always computed from cart contents so it's consistent)
  const subtotalNumber = cart?.items?.reduce((s, it) => s + (it.subtotal ?? 0), 0) ?? 0;
  const shippingNumber = subtotalNumber < 599 && subtotalNumber > 0 ? 49 : 0;
  const taxNumber = cart?.taxAmount ?? 0;
  const discountNumber = 0;
  const totalNumber = subtotalNumber + shippingNumber + taxNumber - discountNumber;

  return (
    <div className="bg-white">
      {/* Background color split screen for large screens */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 hidden h-full w-1/2 bg-white lg:block"
      />
      <div
        aria-hidden="true"
        className="fixed top-0 right-0 hidden h-full w-1/2 bg-gray-50 lg:block"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-48">
        <h1 className="sr-only">Order information</h1>

        <section
          aria-labelledby="summary-heading"
          className="bg-gray-50 px-4 pt-16 pb-10 sm:px-6 lg:col-start-2 lg:row-start-1 lg:bg-transparent lg:px-0 lg:pb-16"
        >
          <div className="mx-auto max-w-lg lg:max-w-none">
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            {cartLoading ? (
              <div className="py-6 text-center text-sm text-gray-600">Loading cart…</div>
            ) : productsToRender.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-600">Your cart is empty.</div>
            ) : (
              <ul
                role="list"
                className="divide-y divide-gray-200 text-sm font-medium text-gray-900"
              >
                {productsToRender.map((product) => (
                  <li key={product.id} className="flex items-start space-x-4 py-6">
                    <Image
                      height={500}
                      width={500}
                      alt={product.imageAlt}
                      src={product.imageSrc}
                      className="size-20 flex-none rounded-md object-cover"
                    />
                    <div className="flex-auto space-y-1">
                      <h3>{product.name}</h3>
                      <p className="text-gray-500">{product.color}</p>
                      <p className="text-gray-500">{product.size}</p>
                    </div>
                    <p className="flex-none text-base font-medium">{product.price}</p>
                  </li>
                ))}
              </ul>
            )}

            <dl className="hidden space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-900 lg:block">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd>{formatCurrency(subtotalNumber)}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd>{formatCurrency(shippingNumber)}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Taxes</dt>
                <dd>{formatCurrency(taxNumber)}</dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <dt className="text-base">Total</dt>
                <dd className="text-base">{formatCurrency(totalNumber)}</dd>
              </div>
            </dl>

            <Popover className="fixed inset-x-0 bottom-0 flex flex-col-reverse text-sm font-medium text-gray-900 lg:hidden">
              <div className="relative z-10 border-t border-gray-200 bg-white px-4 sm:px-6">
                <div className="mx-auto max-w-lg">
                  <PopoverButton className="flex w-full items-center py-6 font-medium">
                    <span className="mr-auto text-base">Total</span>
                    <span className="mr-2 text-base">{formatCurrency(totalNumber)}</span>
                    <ChevronUpIcon aria-hidden="true" className="size-5 text-gray-500" />
                  </PopoverButton>
                </div>
              </div>

              <PopoverBackdrop
                transition
                className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
              />
              <PopoverPanel
                transition
                className="relative transform bg-white px-4 py-6 transition duration-300 ease-in-out data-closed:translate-y-full sm:px-6"
              >
                <dl className="mx-auto max-w-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd>{formatCurrency(subtotalNumber)}</dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-gray-600">Shipping</dt>
                    <dd>{formatCurrency(shippingNumber)}</dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-gray-600">Taxes</dt>
                    <dd>{formatCurrency(taxNumber)}</dd>
                  </div>
                </dl>
              </PopoverPanel>
            </Popover>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="px-4 pt-16 pb-36 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0 lg:pb-16"
        >
          <div className="mx-auto max-w-lg lg:max-w-none">
            {/* Contact information */}
            <section aria-labelledby="contact-info-heading">
              <h2 id="contact-info-heading" className="text-lg font-medium text-gray-900">
                Contact information
              </h2>

              <div className="mt-6">
                <label
                  htmlFor="email-address"
                  className="block text-sm/6 font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email-address"
                    name="email-address"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.contactEmail;
                        return copy;
                      });
                    }}
                    autoComplete="email"
                    className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
                {errors.contactEmail && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {errors.contactEmail}
                  </p>
                )}
              </div>
            </section>

            {/* Shipping information */}
            <section aria-labelledby="payment-heading" className="mt-10">
              <h2 id="payment-heading" className="text-lg font-medium text-gray-900">
                Shipping information
              </h2>

              <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4">
                {/* name */}
                <div className="col-span-3 sm:col-span-4">
                  <label htmlFor="name" className="block text-sm/6 font-medium text-gray-700">
                    Full name
                  </label>
                  <div className="mt-2">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={shipping.name}
                      onChange={(e) => updateShipping("name", e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.name"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.name"]}</p>
                  )}
                </div>

                {/* phone */}
                <div className="col-span-3 sm:col-span-4">
                  <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-700">
                    Phone
                  </label>
                  <div className="mt-2">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={shipping.phone}
                      onChange={(e) => updateShipping("phone", e.target.value)}
                      autoComplete="tel"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.phone"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.phone"]}</p>
                  )}
                </div>

                {/* addressLine1 - FULL WIDTH ON MOBILE */}
                <div className="col-span-3 sm:col-span-3">
                  <label htmlFor="addressLine1" className="block text-sm/6 font-medium text-gray-700">
                    Address line 1
                  </label>
                  <div className="mt-2">
                    <input
                      id="addressLine1"
                      name="addressLine1"
                      type="text"
                      value={shipping.addressLine1}
                      onChange={(e) => updateShipping("addressLine1", e.target.value)}
                      autoComplete="street-address"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.addressLine1"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.addressLine1"]}</p>
                  )}
                </div>

                {/* addressLine2 (label changed) - FULL WIDTH ON MOBILE */}
                <div className="col-span-3 sm:col-span-3">
                  <label htmlFor="addressLine2" className="block text-sm/6 font-medium text-gray-700">
                    Landmark, Apartment, suite, etc.
                  </label>
                  <div className="mt-2">
                    <input
                      id="addressLine2"
                      name="addressLine2"
                      type="text"
                      value={shipping.addressLine2}
                      onChange={(e) => updateShipping("addressLine2", e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                {/* city */}
                <div>
                  <label htmlFor="city" className="block text-sm/6 font-medium text-gray-700">
                    City
                  </label>
                  <div className="mt-2">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={shipping.city}
                      onChange={(e) => updateShipping("city", e.target.value)}
                      autoComplete="address-level2"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.city"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.city"]}</p>
                  )}
                </div>

                {/* state */}
                <div>
                  <label htmlFor="state" className="block text-sm/6 font-medium text-gray-700">
                    State
                  </label>
                  <div className="mt-2">
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={shipping.state}
                      onChange={(e) => updateShipping("state", e.target.value)}
                      autoComplete="address-level1"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.state"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.state"]}</p>
                  )}
                </div>

                {/* pincode */}
                <div>
                  <label htmlFor="pincode" className="block text-sm/6 font-medium text-gray-700">
                    Postal code
                  </label>
                  <div className="mt-2">
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      value={shipping.pincode}
                      onChange={(e) => updateShipping("pincode", e.target.value)}
                      autoComplete="postal-code"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.pincode"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.pincode"]}</p>
                  )}
                </div>

                {/* country */}
                <div className="sm:col-span-3">
                  <label htmlFor="country" className="block text-sm/6 font-medium text-gray-700">
                    Country
                  </label>
                  <div className="mt-2">
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={shipping.country}
                      onChange={(e) => updateShipping("country", e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  {errors["shipping.country"] && (
                    <p className="mt-2 text-sm text-red-600">{errors["shipping.country"]}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Payment Method (kept as you added) */}
            <section aria-labelledby="billing-heading" className="mt-10">
              <h2 id="billing-heading" className="text-lg font-medium text-gray-900 mb-4">
                Payment Method
              </h2>

              <fieldset>
                <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Pay Online Option */}
                  <label
                    aria-label="Pay Online"
                    aria-description="Pay securely using Card, UPI, or NetBanking"
                    className="group relative flex rounded-lg border border-gray-300 bg-white p-4 
                 has-checked:outline-2 has-checked:-outline-offset-2 has-checked:outline-indigo-600 
                 has-focus-visible:outline-3 has-focus-visible:-outline-offset-1 
                 has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25"
                  >
                    <input
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => {
                        setPaymentMethod("online");
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.paymentMethod;
                          return copy;
                        });
                      }}
                      name="paymentMethod"
                      type="radio"
                      className="absolute inset-0 appearance-none focus:outline-none"
                    />
                    <div className="flex-1">
                      <span className="block text-base font-medium text-gray-900">Pay Online</span>
                      <span className="mt-1 block text-sm text-gray-500">
                        Pay securely using Card, UPI, or NetBanking.
                      </span>
                    </div>
                    <CheckCircleIcon
                      aria-hidden="true"
                      className={`invisible size-5 text-indigo-600 ${paymentMethod === "online" ? "group-has-checked:visible visible" : ""}`}
                    />
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    aria-label="Cash on Delivery"
                    aria-description="Pay when the product is delivered to your address"
                    className="group relative flex rounded-lg border border-gray-300 bg-white p-4 
                 has-checked:outline-2 has-checked:-outline-offset-2 has-checked:outline-indigo-600 
                 has-focus-visible:outline-3 has-focus-visible:-outline-offset-1 
                 has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25"
                  >
                    <input
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => {
                        setPaymentMethod("cod");
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.paymentMethod;
                          return copy;
                        });
                      }}
                      name="paymentMethod"
                      type="radio"
                      className="absolute inset-0 appearance-none focus:outline-none"
                    />
                    <div className="flex-1">
                      <span className="block text-base font-medium text-gray-900">Cash on Delivery</span>
                      <span className="mt-1 block text-sm text-gray-500">
                        Pay when the product is delivered to your address.
                      </span>
                    </div>
                    <CheckCircleIcon
                      aria-hidden="true"
                      className={`invisible size-5 text-indigo-600 ${paymentMethod === "cod" ? "group-has-checked:visible visible" : ""}`}
                    />
                  </label>
                </div>
                {errors["paymentMethod"] && (
                  <p className="mt-2 text-sm text-red-600">{errors["paymentMethod"]}</p>
                )}
              </fieldset>
            </section>

            <div className="mt-10 border-t border-gray-200 pt-6 sm:flex sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden sm:order-last sm:ml-6 sm:w-auto"
              >
                {submitting ? "Processing..." : "Continue"}
              </button>
              <p className="mt-4 text-center text-sm text-gray-500 sm:mt-0 sm:text-left">
                You won&apos;t be charged until the next step.
              </p>
            </div>

            {/* Feedback */}
            {submitError && (
              <div className="mt-4 text-sm text-red-600">Error: {submitError}</div>
            )}
            {submitSuccess && (
              <div className="mt-4 text-sm text-green-600">{submitSuccess}</div>
            )}
            {cartError && (
              <div className="mt-4 text-sm text-red-600">Cart error: {cartError}</div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
