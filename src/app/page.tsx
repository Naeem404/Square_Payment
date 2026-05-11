"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DollarSign, CreditCard, Shield, ArrowLeft, Loader2, Wifi, Settings } from "lucide-react";
import PaymentFlow from "@/components/PaymentFlow";
import Link from "next/link";

type AppState = "select" | "waiting-for-tap" | "payment" | "success" | "error";
type PaymentMode = "terminal" | "web";

export default function KioskPage() {
  const [state, setState] = useState<AppState>("select");
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("terminal");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("msa-kiosk-device-id");
    if (saved) {
      setDeviceId(saved);
      setPaymentMode("terminal");
    } else {
      setPaymentMode("web");
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state === "success" || state === "error") {
      timer = setTimeout(() => {
        resetToHome();
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const resetToHome = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setState("select");
    setSelectedAmount(0);
    setPaymentResult(null);
    setErrorMessage("");
  };

  const handleAmountSelect = async (cents: number) => {
    setSelectedAmount(cents);

    if (paymentMode === "terminal" && deviceId) {
      setState("waiting-for-tap");
      try {
        const res = await fetch("/api/terminal-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountCents: cents, deviceId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const checkoutId = data.checkout.id;
        pollCheckoutStatus(checkoutId);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to activate reader");
        setState("error");
      }
    } else {
      setState("payment");
    }
  };

  const pollCheckoutStatus = useCallback((checkoutId: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout-status?id=${checkoutId}`);
        const data = await res.json();

        if (data.status === "COMPLETED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentResult(data);
          setState("success");
        } else if (data.status === "CANCELED" || data.status === "CANCEL_REQUESTED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setErrorMessage(data.cancelReason || "Payment was canceled");
          setState("error");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  }, []);

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    setState("success");
  };

  const handlePaymentError = (message: string) => {
    setErrorMessage(message);
    setState("error");
  };

  if (state === "success") {
    return <SuccessScreen amount={selectedAmount} result={paymentResult} onReset={resetToHome} />;
  }

  if (state === "error") {
    return <ErrorScreen message={errorMessage} onReset={resetToHome} />;
  }

  if (state === "waiting-for-tap") {
    return <WaitingForTapScreen amount={selectedAmount} onCancel={resetToHome} />;
  }

  if (state === "payment") {
    return (
      <PaymentFlow
        amountCents={selectedAmount}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={resetToHome}
      />
    );
  }

  return (
    <div className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-6">
          <Shield className="w-10 h-10 text-brand-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          MSA Payments
        </h1>
        <p className="text-xl text-gray-400">
          Tap an amount to get started
        </p>
      </div>

      {/* Amount Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mb-12">
        <AmountButton
          amount={5}
          cents={500}
          onSelect={handleAmountSelect}
          color="blue"
        />
        <AmountButton
          amount={10}
          cents={1000}
          onSelect={handleAmountSelect}
          color="emerald"
        />
      </div>

      {/* Status + Footer */}
      <div className="flex flex-col items-center gap-3">
        {paymentMode === "terminal" && deviceId ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Wifi className="w-4 h-4" />
            <span>Reader connected — tap amount, then tap card</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <CreditCard className="w-4 h-4" />
            <span>No reader paired — using online card entry</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span>Powered by Square</span>
        </div>
      </div>

      {/* Setup + Admin links */}
      <Link
        href="/setup"
        className="fixed top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
        title="Reader Setup"
      >
        <Settings className="w-5 h-5" />
      </Link>
      <a
        href="/admin"
        className="fixed bottom-4 right-4 w-8 h-8 opacity-0 hover:opacity-20 transition-opacity"
        aria-label="Admin"
      />
    </div>
  );
}

function WaitingForTapScreen({
  amount,
  onCancel,
}: {
  amount: number;
  onCancel: () => void;
}) {
  return (
    <div className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 p-6">
      <div className="text-center">
        <div className="pulse-glow inline-flex items-center justify-center w-32 h-32 rounded-full bg-brand-500/20 border-4 border-brand-400 mb-8">
          <CreditCard className="w-16 h-16 text-brand-300" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Tap Your Card
        </h1>
        <p className="text-2xl text-brand-300 mb-2 font-semibold">
          ${(amount / 100).toFixed(2)}
        </p>
        <p className="text-gray-400 mb-8">
          Hold your card near the reader
        </p>
        <div className="flex items-center justify-center gap-3 mb-12">
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          <span className="text-gray-400">Waiting for card...</span>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

function AmountButton({
  amount,
  cents,
  onSelect,
  color,
}: {
  amount: number;
  cents: number;
  onSelect: (cents: number) => void;
  color: "blue" | "emerald";
}) {
  const colorMap = {
    blue: {
      bg: "from-brand-600 to-brand-700",
      hover: "hover:from-brand-500 hover:to-brand-600",
      shadow: "shadow-brand-500/25",
      ring: "ring-brand-400",
      icon: "text-brand-200",
    },
    emerald: {
      bg: "from-emerald-600 to-emerald-700",
      hover: "hover:from-emerald-500 hover:to-emerald-600",
      shadow: "shadow-emerald-500/25",
      ring: "ring-emerald-400",
      icon: "text-emerald-200",
    },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={() => onSelect(cents)}
      className={`
        group relative overflow-hidden rounded-3xl bg-gradient-to-br ${c.bg} ${c.hover}
        p-8 shadow-2xl ${c.shadow} transition-all duration-300
        hover:scale-[1.03] hover:shadow-3xl active:scale-[0.98]
        focus:outline-none focus:ring-4 ${c.ring} focus:ring-offset-2 focus:ring-offset-gray-950
      `}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={`${c.icon} transition-transform group-hover:scale-110`}>
          <DollarSign className="w-12 h-12" />
        </div>
        <span className="text-5xl font-extrabold text-white">
          ${amount}
        </span>
        <span className="text-lg font-medium text-white/70">
          Tap to Pay
        </span>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </button>
  );
}

function SuccessScreen({
  amount,
  result,
  onReset,
}: {
  amount: number;
  result: any;
  onReset: () => void;
}) {
  return (
    <div
      className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-950 p-6 cursor-pointer"
      onClick={onReset}
    >
      <div className="text-center animate-slide-up">
        <div className="animate-checkmark inline-flex items-center justify-center w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-400 mb-8">
          <svg className="w-14 h-14 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-emerald-400 mb-4">
          Thank You!
        </h1>
        <p className="text-2xl text-white mb-2">
          Payment of <span className="font-bold">${(amount / 100).toFixed(2)}</span> received
        </p>
        <p className="text-gray-400 mb-8">
          JazakAllahu Khair for your support
        </p>
        {result?.payment?.receiptUrl && (
          <p className="text-sm text-gray-500">
            Receipt available at checkout
          </p>
        )}
        <p className="text-sm text-gray-600 mt-8 animate-pulse">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <div
      className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-gray-900 to-gray-950 p-6 cursor-pointer"
      onClick={onReset}
    >
      <div className="text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-red-500/20 border-4 border-red-400 mb-8">
          <svg className="w-14 h-14 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-red-400 mb-4">
          Payment Failed
        </h1>
        <p className="text-xl text-gray-300 mb-2">{message}</p>
        <p className="text-gray-500 mb-8">Please try again</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Try Again
        </button>
      </div>
    </div>
  );
}
