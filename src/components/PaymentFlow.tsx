"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2, CreditCard, Smartphone } from "lucide-react";

declare global {
  interface Window {
    Square: any;
  }
}

interface PaymentFlowProps {
  amountCents: number;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

type PaymentMethod = "card" | "applePay" | "googlePay";

export default function PaymentFlow({
  amountCents,
  onSuccess,
  onError,
  onCancel,
}: PaymentFlowProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing payment...");
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const amountDisplay = `$${(amountCents / 100).toFixed(2)}`;

  const loadSquareSDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="square"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        return;
      }

      const script = document.createElement("script");
      const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;
      script.src =
        env === "production"
          ? "https://web.squarecdn.com/v1/square.js"
          : "https://sandbox.web.squarecdn.com/v1/square.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Square SDK"));
      document.head.appendChild(script);
    });
  }, []);

  const initializeCard = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      setStatusMessage("Loading payment system...");
      await loadSquareSDK();
      setSdkReady(true);

      const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;

      setStatusMessage("Connecting to Square...");
      const payments = window.Square.payments(appId, locationId);
      paymentsRef.current = payments;

      setStatusMessage("Preparing card reader...");
      const card = await payments.card();

      const container = document.getElementById("card-container");
      if (container) {
        container.innerHTML = "";
      }
      await card.attach("#card-container");
      cardRef.current = card;

      setCardReady(true);
      setIsLoading(false);
      setStatusMessage("Ready — enter card details below");
    } catch (err: any) {
      console.error("Square init error:", err);
      setIsLoading(false);
      setStatusMessage("Failed to initialize. Please try again.");
    }
  }, [loadSquareSDK]);

  useEffect(() => {
    initializeCard();

    return () => {
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch {}
      }
      initializedRef.current = false;
    };
  }, [initializeCard]);

  const processPayment = async () => {
    if (!cardRef.current || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage("Processing payment...");

    try {
      const tokenResult = await cardRef.current.tokenize();

      if (tokenResult.status !== "OK") {
        const errorMsg =
          tokenResult.errors?.[0]?.message || "Card tokenization failed";
        setIsProcessing(false);
        setStatusMessage("Payment failed — please try again");
        onError(errorMsg);
        return;
      }

      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          amountCents,
          note: `MSA Kiosk - ${amountDisplay}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment failed");
      }

      onSuccess(result);
    } catch (err: any) {
      console.error("Payment processing error:", err);
      setIsProcessing(false);
      onError(err.message || "Payment processing failed. Please try again.");
    }
  };

  return (
    <div className="kiosk-mode min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="text-right">
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-2xl font-bold text-white">{amountDisplay}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {/* Card icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4">
              <CreditCard className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Pay {amountDisplay}
            </h2>
            <p className="text-gray-400">{statusMessage}</p>
          </div>

          {/* Card form container */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                <p className="text-gray-400 text-sm">Setting up secure payment...</p>
              </div>
            )}
            <div
              id="card-container"
              className={isLoading ? "hidden" : "animate-slide-up"}
            />
          </div>

          {/* Pay button */}
          {cardReady && (
            <button
              onClick={processPayment}
              disabled={isProcessing}
              className={`
                w-full py-5 rounded-2xl font-bold text-lg transition-all
                ${
                  isProcessing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.98]"
                }
              `}
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                `Pay ${amountDisplay}`
              )}
            </button>
          )}

          {/* Digital wallet hint */}
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Apple Pay & Google Pay supported on compatible devices</span>
          </div>
        </div>
      </div>
    </div>
  );
}
