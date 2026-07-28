/**
 * Horizon REST API helpers.
 *
 * These functions call the Stellar Horizon REST API directly so the app
 * works before installing the full @stellar/stellar-sdk package.
 * Once the SDK is installed, replace the fetch calls with:
 *
 *   import { Horizon } from "@stellar/stellar-sdk";
 *   const server = new Horizon.Server(HORIZON_URL);
 *   const account = await server.loadAccount(publicKey);
 *
 * Install command:
 *   npm install @stellar/stellar-sdk
 */

import { HORIZON_URL, CHRONO_ASSET_CODE, CHRONO_ISSUER } from "./config";
import type { StellarAccountInfo } from "./types";

// ─── Raw Horizon account response (subset) ────────────────────────────────────

interface HorizonBalance {
  asset_type: "native" | "credit_alphanum4" | "credit_alphanum12";
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface HorizonAccountResponse {
  id: string;
  balances: HorizonBalance[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXlm(raw: number): string {
  return `${raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches account info from Horizon for the given public key.
 * Returns null if the account does not exist on the network.
 *
 * @example
 *   const info = await fetchAccountInfo("GAAZI4...");
 *   if (info) console.log(info.xlmBalance); // "1,240.00 XLM"
 */
export async function fetchAccountInfo(
  publicKey: string,
): Promise<StellarAccountInfo | null> {
  const url = `${HORIZON_URL}/accounts/${encodeURIComponent(publicKey)}`;

  let data: HorizonAccountResponse;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Horizon responded with ${res.status}`);
    }
    data = (await res.json()) as HorizonAccountResponse;
  } catch (err) {
    throw new Error(
      `Failed to load account from Horizon: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const xlmBalance = data.balances.find((b) => b.asset_type === "native");
  const xlmRaw = xlmBalance ? parseFloat(xlmBalance.balance) : 0;

  const chronoBalance = data.balances.find(
    (b) =>
      b.asset_code === CHRONO_ASSET_CODE &&
      b.asset_issuer === CHRONO_ISSUER,
  );

  return {
    publicKey,
    xlmBalance: formatXlm(xlmRaw),
    xlmBalanceRaw: xlmRaw,
    hasChronoTrustline: chronoBalance !== undefined,
    chronoBalance: chronoBalance
      ? `${parseFloat(chronoBalance.balance).toFixed(2)} ${CHRONO_ASSET_CODE}`
      : "0.00 CHRONO",
  };
}

/**
 * Fetches the current network fee stats from Horizon.
 * Returns the recommended base fee in stroops (1 XLM = 10,000,000 stroops).
 */
export async function fetchNetworkFee(): Promise<number> {
  const url = `${HORIZON_URL}/fee_stats`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 }, // cache for 30 s in Next.js App Router
    });
    if (!res.ok) return 100; // fallback: 100 stroops (0.00001 XLM)
    const data = (await res.json()) as { fee_charged: { p50: string } };
    return parseInt(data.fee_charged.p50, 10) || 100;
  } catch {
    return 100;
  }
}

/**
 * Submits a signed transaction XDR to Horizon.
 * Returns the transaction hash on success. Throws on failure.
 */
export async function submitTransaction(signedXdr: string): Promise<string> {
  const url = `${HORIZON_URL}/transactions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `tx=${encodeURIComponent(signedXdr)}`,
  });

  const data = (await res.json()) as { hash?: string; title?: string; detail?: string };

  if (!res.ok) {
    throw new Error(
      data.detail ?? data.title ?? `Transaction failed (HTTP ${res.status})`,
    );
  }

  if (!data.hash) throw new Error("Transaction submitted but no hash returned.");
  return data.hash;
}
