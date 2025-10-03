"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Status = "checking" | "success" | "failed" | "not-found";

export default function CheckStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  // store timer id to clear it later
  const timerRef = useRef<number | null>(null);
  // avoid updating state after unmount
  const mountedRef = useRef(true);

  const merchantOrderId = searchParams.get("merchantOrderId");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!merchantOrderId || !orderId) {
      setStatus("not-found");
      return;
    }

    // polling function (recursive via setTimeout to avoid overlaps)
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/payment/status?merchantOrderId=${encodeURIComponent(
            merchantOrderId
          )}&orderId=${encodeURIComponent(orderId)}`
        );

        // if the server responds slowly, this await prevents the next poll until this completes
        const data = await res.json().catch(() => ({ error: "invalid-json" }));

        if (!mountedRef.current) return;

        if (!res.ok) {
          console.error("Status API error:", data);
          // Handle authentication error specially if you want
          setStatus("failed");
          return;
        }

        const rawStatus: string = data.paymentStatus;
        // accept both 'paid' and 'success' from backend to be safe
        const isSuccess = rawStatus === "success" || rawStatus === "paid";
        const isPending = rawStatus === "pending" || rawStatus === "checking";
        const isFailed = rawStatus === "failed";

        if (isSuccess) {
          setStatus("success");
          // stop polling and redirect after a short delay for UX
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setTimeout(() => {
            // guard mounted
            if (mountedRef.current) router.push("/orders");
          }, 1200);
          return;
        }

        if (isFailed) {
          setStatus("failed");
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        // still pending -> keep polling
        setStatus("checking");
        // schedule next poll after 3s
        timerRef.current = window.setTimeout(poll, 3000);
      } catch (err) {
        console.error("Error while polling payment status:", err);
        if (!mountedRef.current) return;
        setStatus("failed");
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    // start immediately
    poll();

    // cleanup when merchantOrderId/orderId changes or component unmounts
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [merchantOrderId, orderId, router]);

  const getStatusMessage = () => {
    switch (status) {
      case "checking":
        return "⏳ Checking payment status...";
      case "success":
        return "✅ Payment successful! Redirecting to your orders...";
      case "failed":
        return "❌ Payment failed. Please try again.";
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
        {status === "failed" && (
          <button
            onClick={() => router.push("/orders")}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Go to Orders
          </button>
        )}
      </div>
    </div>
  );
}
