"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Webhook, Trash2, Copy, Plus, Eye, EyeOff, Activity, ShieldCheck, Check } from "lucide-react";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { PanelShell } from "@/components/dashboard";
import { AsyncButton } from "@/app/components/ui/async-button";

// ─── API Keys Component ────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState([
    { id: "1", name: "Production Key", prefix: "sk_live_", masked: "••••abcd", created: "Oct 12, 2025", lastUsed: "2 mins ago" },
    { id: "2", name: "Test Key", prefix: "sk_test_", masked: "••••qwer", created: "Sep 01, 2025", lastUsed: "Never" },
  ]);

  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">API Keys</h2>
          <p className="helper-text helper-text--muted mt-1">
            API keys are like passwords. Store them securely and never share them publicly.
          </p>
        </div>
        <AsyncButton
          onAction={async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Simulate adding a key
            setKeys([{ id: Date.now().toString(), name: "New API Key", prefix: "sk_live_", masked: "••••new", created: "Just now", lastUsed: "Never" }, ...keys]);
          }}
          labels={{ idle: "Generate New Key", pending: "Generating...", confirmed: "Key Generated", error: "Failed" }}
          variant="primary"
          className="shadow-[0_0_20px_rgba(103,232,249,0.3)] hover:shadow-[0_0_30px_rgba(103,232,249,0.5)]"
        />
      </div>

      <div className="grid gap-4">
        {keys.length === 0 ? (
          <div className="card card--glass text-center py-12">
            <Key className="mx-auto h-12 w-12 text-slate-500 mb-4 opacity-50" />
            <p className="text-slate-300 font-medium">No API keys found</p>
            <p className="helper-text helper-text--muted mt-2">Generate a key to authenticate your integration.</p>
          </div>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="card card--interactive card--panel flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">{key.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-cyan-400">{key.prefix}</span>
                  <span className="text-slate-400">
                    {showSecret === key.id ? "1234567890abcdef" : key.masked}
                  </span>
                  <button
                    onClick={() => setShowSecret(showSecret === key.id ? null : key.id)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors focus-ring-cyan rounded"
                    aria-label="Toggle secret visibility"
                  >
                    {showSecret === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(key.id, `${key.prefix}1234567890abcdef`)}
                    className="p-1 text-slate-500 hover:text-cyan-400 transition-colors focus-ring-cyan rounded"
                    aria-label="Copy API Key"
                  >
                    {copiedId === key.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="hidden lg:block text-slate-400">
                  <p>Created: <span className="text-slate-300">{key.created}</span></p>
                  <p>Last used: <span className="text-slate-300">{key.lastUsed}</span></p>
                </div>
                <AsyncButton
                  onAction={() => handleRevoke(key.id)}
                  labels={{ idle: "Revoke", pending: "Revoking...", confirmed: "Revoked", error: "Error" }}
                  variant="secondary"
                  size="sm"
                  className="!text-rose-400 hover:!bg-rose-400/10 hover:!border-rose-400/30"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Webhooks Component ────────────────────────────────────────────────────────

function WebhooksTab() {
  const [endpoints, setEndpoints] = useState([
    { id: "1", url: "https://api.myapp.com/webhooks/chronopay", status: "active", events: ["payment.success", "payment.failed"] },
  ]);
  const [secretVisible, setSecretVisible] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText("whsec_test_secret_12345");
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleTestEndpoint = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <div className="space-y-8">
      {/* Webhook Secret Card */}
      <PanelShell title="Webhook Secret">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="helper-text helper-text--muted mb-3">
              Use this secret to verify that webhook events are sent by ChronoPay. Do not share this secret.
            </p>
            <div className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <code className="font-mono text-slate-200 flex-1 break-all">
                {secretVisible ? "whsec_test_secret_12345" : "whsec_••••••••••••••••••••"}
              </code>
              <button
                onClick={() => setSecretVisible(!secretVisible)}
                className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded"
              >
                {secretVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopySecret}
                className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors rounded"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <AsyncButton
            onAction={async () => await new Promise((r) => setTimeout(r, 1000))}
            labels={{ idle: "Rotate Secret", pending: "Rotating...", confirmed: "Rotated", error: "Error" }}
            variant="secondary"
          />
        </div>
      </PanelShell>

      {/* Endpoints List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-medium text-white">Endpoints</h2>
            <p className="helper-text helper-text--muted mt-1">
              Configure URLs to receive real-time event notifications.
            </p>
          </div>
          <AsyncButton
            onAction={async () => await new Promise((r) => setTimeout(r, 800))}
            labels={{ idle: "Add Endpoint", pending: "Adding...", confirmed: "Added", error: "Error" }}
            variant="primary"
          />
        </div>

        <div className="grid gap-4">
          {endpoints.length === 0 ? (
            <div className="card card--glass text-center py-12">
              <Webhook className="mx-auto h-12 w-12 text-slate-500 mb-4 opacity-50" />
              <p className="text-slate-300 font-medium">No endpoints configured</p>
              <p className="helper-text helper-text--muted mt-2">Add an endpoint to start receiving events.</p>
            </div>
          ) : (
            endpoints.map((ep) => (
              <div key={ep.id} className="card card--interactive card--panel flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium text-slate-100 break-all">{ep.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ep.events.map((evt) => (
                      <span key={evt} className="text-xs px-2.5 py-1 rounded-md bg-cyan-950/40 text-cyan-200 border border-cyan-900/50">
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 md:mt-0">
                  <AsyncButton
                    onAction={handleTestEndpoint}
                    labels={{ idle: "Test", pending: "Sending...", confirmed: "Sent", error: "Failed" }}
                    variant="secondary"
                    size="sm"
                  />
                  <button className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors focus-ring-cyan">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"api-keys" | "webhooks">("api-keys");

  return (
    <DashboardShell>
      <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-12">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl text-white">Developer Settings</h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Manage your API keys and webhook endpoints for integration.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-1 rounded-xl bg-slate-900/50 p-1 w-full max-w-md border border-slate-800">
          <button
            onClick={() => setActiveTab("api-keys")}
            className={`relative flex-1 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-ring-cyan ${
              activeTab === "api-keys" ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "api-keys" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Key className="h-4 w-4" /> API Keys
            </span>
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`relative flex-1 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-ring-cyan ${
              activeTab === "webhooks" ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "webhooks" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Webhook className="h-4 w-4" /> Webhooks
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "api-keys" ? <ApiKeysTab /> : <WebhooksTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
