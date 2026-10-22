import React from "react";
import type { WalletProvider } from "./WalletConnectModal";

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: "freighter",
    name: "Freighter",
    recommended: true,
    capabilities: ["sign", "auth", "soroban"],
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-full w-full"
      >
        <rect width="48" height="48" rx="12" fill="currentColor" className="text-cyan-500/20" />
        <path
          d="M16 18c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v2H16v-2Z"
          fill="currentColor"
          className="text-cyan-400"
        />
        <rect x="14" y="20" width="20" height="16" rx="3" fill="currentColor" className="text-cyan-500/30" />
        <rect x="22" y="26" width="4" height="4" rx="1" fill="currentColor" className="text-cyan-300" />
        <circle cx="24" cy="28" r="2" fill="currentColor" className="text-cyan-200" />
      </svg>
    ),
  },
  {
    id: "xbull",
    name: "xBull",
    capabilities: ["sign", "auth", "stellar"],
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-full w-full"
      >
        <rect width="48" height="48" rx="12" fill="currentColor" className="text-amber-500/20" />
        <path
          d="M15 17l6 7-6 7M33 17l-6 7 6 7"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-400"
        />
        <circle cx="24" cy="24" r="5" fill="currentColor" className="text-amber-300" />
      </svg>
    ),
  },
  {
    id: "albedo",
    name: "Albedo",
    capabilities: ["sign", "web-based"],
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-full w-full"
      >
        <rect width="48" height="48" rx="12" fill="currentColor" className="text-violet-500/20" />
        <circle cx="24" cy="24" r="10" fill="currentColor" className="text-violet-400/30" />
        <path
          d="M24 16a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8Z"
          fill="currentColor"
          className="text-violet-300/50"
        />
        <circle cx="24" cy="24" r="4" fill="currentColor" className="text-violet-200" />
      </svg>
    ),
  },
];

export interface ConnectWalletResult {
  address: string;
  label?: string;
  provider: string;
}

export type WalletConnector = (providerId: string) => Promise<ConnectWalletResult>;

export const defaultWalletConnector: WalletConnector = async (providerId: string) => {
  if (providerId === "unsupported" || providerId === "error" || providerId === "fail") {
    throw new Error(`Failed to connect to ${providerId}: Extension not responding`);
  }

  const mockAddresses: Record<string, string> = {
    freighter: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    xbull: "GBXBL4OQJ2KLK6GVM3V7W5X3M4YVJY6XLP3DQE7H6R5YTZ1KLA8BULL",
    albedo: "GD6WNTESP5HB7SRDKOZNVPHKBF7BQHK7VMQFHPVDG3XMHXF3CRXOYZK",
  };

  const address =
    mockAddresses[providerId] ||
    `G${providerId.toUpperCase().slice(0, 4)}TESTNET${Date.now().toString(36).toUpperCase()}`;

  const name = providerId.charAt(0).toUpperCase() + providerId.slice(1);

  return {
    address,
    label: `${name} Account`,
    provider: providerId,
  };
};
