/**
 * Stellar network configuration.
 *
 * Switch STELLAR_NETWORK to "public" (mainnet) before going to production.
 * All Horizon and SDK references read from these constants so there is a
 * single place to promote from testnet → mainnet.
 */

export type StellarNetwork = "testnet" | "public";

export const STELLAR_NETWORK: StellarNetwork =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork | undefined) ??
  "testnet";

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ??
  (STELLAR_NETWORK === "public"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org");

/** Minimum XLM reserve required for a new Stellar account (2 base reserves). */
export const MINIMUM_ACCOUNT_BALANCE = 2;

/** ChronoPay smart-escrow contract address (placeholder — set via env). */
export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT ?? "";

/** Asset code for ChronoPay time tokens. */
export const CHRONO_ASSET_CODE = "CHRONO";

/** Issuer address for CHRONO tokens (placeholder — set via env). */
export const CHRONO_ISSUER =
  process.env.NEXT_PUBLIC_CHRONO_ISSUER ?? "";
