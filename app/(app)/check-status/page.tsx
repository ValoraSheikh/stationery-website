"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Status = "checking" | "success" | "failed" | "not-found";

export default function CheckStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const deletionTriggeredRef = useRef(false);

  const merchantOrderId = searchParams.get("merchantOrderId");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const deleteOrderAndRedirect = useCallback(async (id: string) => {
    if (deletionTriggeredRef.current) return;
    deletionTriggeredRef.current = true;
    setIsDeletingOrder(true);

    try {
      await fetch(`/api/order/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      //
    } finally {
      deletionTriggeredRef.current = false;
      setIsDeletingOrder(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = window.setTimeout(() => {
        if (mountedRef.current) router.push("/cart");
      }, 2000);
    }
  }, [router]);

  useEffect(() => {
    if (!merchantOrderId || !orderId) {
      setStatus("not-found");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/payment/status?merchantOrderId=${encodeURIComponent(
            merchantOrderId
          )}&orderId=${encodeURIComponent(orderId)}`
        );

        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json().catch(() => ({}))
          : {};

        if (!mountedRef.current || cancelled) return;

        if (!res.ok) {
          setStatus("failed");
          deleteOrderAndRedirect(orderId);
          return;
        }

        const rawStatus: string = data?.paymentStatus ?? data?.status ?? "";

        const isSuccess = rawStatus === "success" || rawStatus === "paid";
        const isPending = rawStatus === "pending" || rawStatus === "checking";
        const isFailed =
          rawStatus === "failed" ||
          rawStatus === "failure" ||
          rawStatus === "failed_payment";

        if (isSuccess) {
          setStatus("success");
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          timerRef.current = window.setTimeout(() => {
            if (mountedRef.current) router.push(`/orderSummary/${orderId}`);
          }, 1200);
          return;
        }

        if (isFailed) {
          setStatus("failed");
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          deleteOrderAndRedirect(orderId);
          return;
        }

        setStatus("checking");
        timerRef.current = window.setTimeout(poll, 3000);
      } catch {
        if (!mountedRef.current || cancelled) return;
        setStatus("failed");
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        deleteOrderAndRedirect(orderId);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [merchantOrderId, orderId, router, deleteOrderAndRedirect]);

  const getStatusMessage = () => {
    switch (status) {
      case "checking":
        return "⏳ Checking payment status...";
      case "success":
        return "✅ Payment successful! Redirecting to your orders...";
      case "failed":
        return isDeletingOrder
          ? "❌ Payment failed — cleaning up and redirecting to cart..."
          : "❌ Payment failed. Preparing to redirect to cart...";
      case "not-found":
        return "⚠️ Invalid or missing order details.";
      default:
        return "Something went wrong.";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-semibold mb-4 text-gray-500">Payment Status</h1>
        <p className="text-lg text-gray-400">{getStatusMessage()}</p>

        {status === "failed" && !isDeletingOrder && (
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={() => {
                if (orderId) {
                  deleteOrderAndRedirect(orderId);
                } else {
                  router.push("/cart");
                }
              }}
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Go to Cart
            </button>

            <button
              onClick={() => {
                router.refresh();
              }}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry Status Check
            </button>
          </div>
        )}

        {isDeletingOrder && (
          <div className="mt-4 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
