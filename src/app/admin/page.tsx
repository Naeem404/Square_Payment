"use client";

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  status: string;
  amount: string;
  currency: string;
  note: string;
  receiptUrl: string;
  createdAt: string;
  cardBrand: string;
  last4: string;
}

interface Summary {
  totalPayments: number;
  completedPayments: number;
  totalCollected: number;
  totalCollectedFormatted: string;
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async (adminPin: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/list-payments?pin=${adminPin}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPayments(data.payments);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsAuthenticated(true);
    await fetchPayments(pin);
  };

  const handleRefresh = () => {
    fetchPayments(pin);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500/30 mb-4">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400">Enter your PIN to view payments</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter admin PIN"
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl tracking-widest placeholder:text-gray-600 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!pin}
              className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold transition-all"
            >
              View Dashboard
            </button>
          </form>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 mt-6 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kiosk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Payment Dashboard</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Collected"
            value={summary.totalCollectedFormatted}
            color="emerald"
          />
          <SummaryCard
            icon={<CheckCircle2 className="w-6 h-6" />}
            label="Completed"
            value={summary.completedPayments.toString()}
            color="blue"
          />
          <SummaryCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Total Transactions"
            value={summary.totalPayments.toString()}
            color="purple"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Card</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Note</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              )}
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-white">
                    ${(parseInt(payment.amount) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {payment.cardBrand ? `${payment.cardBrand} •••• ${payment.last4}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm max-w-[200px] truncate">
                    {payment.note || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "purple";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-brand-500/10 border-brand-500/20 text-brand-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
      <Clock className="w-3 h-3" /> {status}
    </span>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
