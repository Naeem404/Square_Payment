"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, RefreshCw, Wifi, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface Device {
  id: string;
  name: string;
  status: string;
  locationId: string;
  productType: string;
}

interface DeviceCode {
  id: string;
  code: string;
  status: string;
  locationId: string;
  pairBy: string;
}

export default function SetupPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceCode, setDeviceCode] = useState<DeviceCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    fetchDevices();
    const saved = localStorage.getItem("msa-kiosk-device-id");
    if (saved) setSelectedDeviceId(saved);
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDevices(data.devices || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createPairingCode = async () => {
    setError("");
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-device-code",
          name: "MSA Kiosk Reader",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeviceCode(data.deviceCode);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem("msa-kiosk-device-id", deviceId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Reader Setup</h1>
          <p className="text-gray-400">Pair and manage your Square Readers</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="mb-8 p-6 rounded-2xl bg-brand-500/5 border border-brand-500/20">
        <h2 className="text-lg font-semibold text-brand-300 mb-3">How to Connect Your Square Reader</h2>
        <ol className="space-y-2 text-gray-300 text-sm list-decimal list-inside">
          <li>Make sure your Square Reader is charged and turned on</li>
          <li>On the phone/tablet paired with the reader, open the <strong>Square POS app</strong></li>
          <li>Sign in to your Square account</li>
          <li>The reader will appear below once connected to your account</li>
          <li>Select the reader you want this kiosk to use</li>
        </ol>
      </div>

      {/* Connected Devices */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your Devices</h2>
          <button
            onClick={fetchDevices}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {devices.length === 0 && !isLoading && (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <Wifi className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No devices found.</p>
            <p className="text-gray-500 text-sm mt-1">
              Make sure a phone/tablet with Square POS is signed into your account.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <RefreshCw className="w-8 h-8 text-gray-500 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400">Loading devices...</p>
          </div>
        )}

        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedDeviceId === device.id
                  ? "bg-brand-500/10 border-brand-500/40"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
              onClick={() => selectDevice(device.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{device.name || "Square Reader"}</p>
                  <p className="text-sm text-gray-400">
                    {device.productType} • ID: {device.id.slice(0, 12)}...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {device.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                      <XCircle className="w-3 h-3" /> {device.status}
                    </span>
                  )}
                  {selectedDeviceId === device.id && (
                    <span className="text-brand-400 text-sm font-medium">Selected ✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Device Code */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Pair New Device</h2>
        <p className="text-gray-400 text-sm mb-4">
          If your reader doesn&apos;t appear above, generate a pairing code to connect it.
        </p>

        {!deviceCode ? (
          <button
            onClick={createPairingCode}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            Generate Pairing Code
          </button>
        ) : (
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-2">Enter this code on your Square device:</p>
            <p className="text-4xl font-mono font-bold text-white tracking-widest mb-3">
              {deviceCode.code}
            </p>
            <p className="text-gray-500 text-sm">
              Status: {deviceCode.status} • Expires: {new Date(deviceCode.pairBy).toLocaleTimeString()}
            </p>
            <button
              onClick={() => {
                setDeviceCode(null);
                fetchDevices();
              }}
              className="mt-4 text-brand-400 hover:text-brand-300 text-sm"
            >
              Done / Generate New Code
            </button>
          </div>
        )}
      </div>

      {/* Current Selection */}
      {selectedDeviceId && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400 font-medium">
            ✓ Kiosk will send payments to device: {selectedDeviceId.slice(0, 16)}...
          </p>
          <p className="text-emerald-400/60 text-sm mt-1">
            Go back to the home screen to start accepting payments.
          </p>
        </div>
      )}
    </div>
  );
}
