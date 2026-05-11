"use client";

import { useState, useEffect, useRef } from "react";
import { DollarSign, CreditCard, Shield, Lock, Unlock } from "lucide-react";
import { launchSquarePOS } from "@/lib/square-pos";

const STORAGE_KEY = "msa-kiosk-locked-amount";

export default function KioskPage() {
  const [lockedAmount, setLockedAmount] = useState<number | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const unlockTapCount = useRef(0);
  const unlockTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const cents = parseInt(saved, 10);
      if (cents === 500 || cents === 1000) {
        setLockedAmount(cents);
      }
    }
  }, []);

  const lockAmount = (cents: number) => {
    localStorage.setItem(STORAGE_KEY, String(cents));
    setLockedAmount(cents);
    launchSquarePOS(cents);
  };

  const unlockAmount = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLockedAmount(null);
    setShowUnlock(false);
    unlockTapCount.current = 0;
  };

  const handleLockedScreenTap = () => {
    unlockTapCount.current += 1;

    if (unlockTimer.current) clearTimeout(unlockTimer.current);

    if (unlockTapCount.current >= 5) {
      setShowUnlock(true);
      unlockTapCount.current = 0;
      return;
    }

    unlockTimer.current = setTimeout(() => {
      unlockTapCount.current = 0;
    }, 3000);

    launchSquarePOS(lockedAmount!);
  };

  if (lockedAmount) {
    const dollars = lockedAmount / 100;
    const isBlue = lockedAmount === 500;

    return (
      <div className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 relative">
        {showUnlock && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-sm w-full text-center">
              <Unlock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Unlock Kiosk?</h2>
              <p className="text-gray-400 mb-6">
                This will stop the ${dollars} auto-payment loop and return to amount selection.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnlock(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={unlockAmount}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${isBlue ? "bg-brand-600/20 border border-brand-500/30" : "bg-emerald-600/20 border border-emerald-500/30"}`}>
            <Lock className={`w-10 h-10 ${isBlue ? "text-brand-400" : "text-emerald-400"}`} />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            MSA Payment Kiosk
          </h1>

          <div className={`inline-block px-6 py-3 rounded-2xl mb-6 ${isBlue ? "bg-brand-600/20 border border-brand-500/30" : "bg-emerald-600/20 border border-emerald-500/30"}`}>
            <span className={`text-lg font-semibold ${isBlue ? "text-brand-300" : "text-emerald-300"}`}>
              Locked to ${dollars.toFixed(0)}
            </span>
          </div>

          <button
            onClick={handleLockedScreenTap}
            className={`
              pulse-glow block w-full max-w-xs mx-auto rounded-3xl p-12 shadow-2xl transition-all
              active:scale-[0.97]
              ${isBlue
                ? "bg-gradient-to-br from-brand-600 to-brand-700 shadow-brand-500/25"
                : "bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/25"
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <CreditCard className="w-16 h-16 text-white/80" />
              <span className="text-5xl font-extrabold text-white">
                ${dollars.toFixed(0)}
              </span>
              <span className="text-xl font-medium text-white/70">
                Tap Here to Charge
              </span>
            </div>
          </button>

          <p className="text-gray-500 text-sm mt-8">
            Each tap opens Square POS with ${dollars.toFixed(0)} ready
          </p>
          <p className="text-gray-700 text-xs mt-2">
            Tap 5x rapidly to unlock
          </p>
        </div>

        <a
          href="/admin"
          className="fixed bottom-4 right-4 w-8 h-8 opacity-0 hover:opacity-20 transition-opacity"
          aria-label="Admin"
        />
      </div>
    );
  }

  return (
    <div className="kiosk-mode min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-6">
          <Shield className="w-10 h-10 text-brand-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          MSA Payments
        </h1>
        <p className="text-xl text-gray-400">
          Select an amount to lock this kiosk
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Once locked, it auto-repeats that amount for every payment
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mb-12">
        <AmountButton amount={5} cents={500} onSelect={lockAmount} color="blue" />
        <AmountButton amount={10} cents={1000} onSelect={lockAmount} color="emerald" />
      </div>

      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <CreditCard className="w-4 h-4" />
        <span>Powered by Square</span>
      </div>

      <a
        href="/admin"
        className="fixed bottom-4 right-4 w-8 h-8 opacity-0 hover:opacity-20 transition-opacity"
        aria-label="Admin"
      />
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
          Lock &amp; Start
        </span>
      </div>

      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </button>
  );
}
