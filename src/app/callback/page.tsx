"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { buildSquarePOSUrl } from "@/lib/square-pos";

const STORAGE_KEY = "msa-kiosk-locked-amount";
const AUTO_RELAUNCH_DELAY = 4000;

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [details, setDetails] = useState<any>(null);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    try {
      const dataParam = searchParams.get("data");
      const errorCode = searchParams.get("error_code");

      if (errorCode) {
        setStatus("error");
        setDetails({ errorCode, description: getErrorDescription(errorCode) });
      } else if (dataParam) {
        const decoded = JSON.parse(atob(dataParam));
        if (decoded.status === "ok" || decoded.transaction_id) {
          setStatus("success");
          setDetails(decoded);
        } else {
          setStatus("error");
          setDetails(decoded);
        }
      } else {
        setStatus("success");
        setDetails({ note: "Payment completed via Square POS" });
      }
    } catch {
      setStatus("success");
      setDetails({ note: "Returned from Square POS" });
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "loading") return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timer = setTimeout(() => {
      relaunchOrGoHome();
    }, AUTO_RELAUNCH_DELAY);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [status]);

  const relaunchOrGoHome = () => {
    const lockedAmount = localStorage.getItem(STORAGE_KEY);
    if (lockedAmount) {
      const cents = parseInt(lockedAmount, 10);
      const url = buildSquarePOSUrl(cents);
      if (url) {
        window.location.href = url;
        return;
      }
    }
    window.location.href = "/";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Processing...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-gray-900 to-gray-950 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-red-500/20 border-4 border-red-400 mb-8">
            <svg className="w-14 h-14 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-red-400 mb-4">Payment Issue</h1>
          <p className="text-xl text-gray-300 mb-2">
            {details?.description || details?.errorCode || "Something went wrong"}
          </p>
          <p className="text-gray-500 mb-4">Retrying automatically...</p>
          <p className="text-gray-600 text-sm animate-pulse">
            Next payment in {countdown}s
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-950 p-6">
      <div className="text-center animate-slide-up">
        <div className="animate-checkmark inline-flex items-center justify-center w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-400 mb-8">
          <svg className="w-14 h-14 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-emerald-400 mb-4">Thank You!</h1>
        <p className="text-2xl text-white mb-2">Payment received</p>
        <p className="text-gray-400 mb-6">JazakAllahu Khair for your support</p>
        {details?.transaction_id && (
          <p className="text-sm text-gray-500 mb-4">
            Ref: {details.transaction_id.slice(0, 12)}...
          </p>
        )}
        <p className="text-gray-600 text-sm animate-pulse">
          Ready for next payment in {countdown}s
        </p>
      </div>
    </div>
  );
}

function getErrorDescription(code: string): string {
  const errors: Record<string, string> = {
    payment_canceled: "Payment was canceled",
    user_not_logged_in: "Please sign in to Square POS app first",
    no_network: "No internet connection — check your network",
    unsupported_api_version: "Square app needs to be updated",
    no_result: "No payment result received",
    not_logged_in: "Please log in to Square POS app",
    could_not_perform: "Could not process payment — try again",
    illegal_location_id: "Invalid Square location — check your settings",
  };
  return errors[code] || `Error: ${code}`;
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
