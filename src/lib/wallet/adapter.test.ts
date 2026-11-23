import { describe, it, expect, afterEach, vi } from "vitest";
import {
  EXPECTED_NETWORK,
  MOCK_ADDRESS,
  WalletError,
  createMockAdapter,
  freighterAdapter,
  isValidStellarAddress,
  toWalletError,
} from "./adapter";

function setFreighterApi(api: unknown) {
  (window as unknown as { freighterApi?: unknown }).freighterApi = api;
}

afterEach(() => {
  setFreighterApi(undefined);
});

describe("isValidStellarAddress", () => {
  it("accepts a 56-character G-prefixed public key", () => {
    expect(isValidStellarAddress(MOCK_ADDRESS)).toBe(true);
  });

  it("rejects the wrong prefix, the wrong length and non-strings", () => {
    expect(isValidStellarAddress(`A${MOCK_ADDRESS.slice(1)}`)).toBe(false);
    expect(isValidStellarAddress(MOCK_ADDRESS.slice(0, 55))).toBe(false);
    expect(isValidStellarAddress("0x12a4F9b3c7D8e9A1fB2C")).toBe(false);
    expect(isValidStellarAddress(undefined)).toBe(false);
  });
});

describe("toWalletError", () => {
  it("returns the original WalletError instance", () => {
    const error = new WalletError("USER_REJECTED", "nope");
    expect(toWalletError(error)).toBe(error);
  });

  it("maps rejection wording to USER_REJECTED", () => {
    expect(toWalletError(new Error("User declined the request")).code).toBe(
      "USER_REJECTED",
    );
  });

  it("maps network wording to WRONG_NETWORK", () => {
    expect(toWalletError(new Error("wrong network")).code).toBe("WRONG_NETWORK");
  });

  it("falls back to UNKNOWN for anything else", () => {
    expect(toWalletError(new Error("boom")).code).toBe("UNKNOWN");
    expect(toWalletError("boom").code).toBe("UNKNOWN");
  });
});

describe("freighterAdapter", () => {
  it("throws a NOT_INSTALLED error when the extension is absent", async () => {
    setFreighterApi(undefined);
    await expect(freighterAdapter.connect()).rejects.toMatchObject({
      code: "NOT_INSTALLED",
    });
  });

  it("connects and returns the address and network", async () => {
    setFreighterApi({
      requestAccess: vi.fn().mockResolvedValue(undefined),
      getPublicKey: vi.fn().mockResolvedValue(MOCK_ADDRESS),
      getNetwork: vi.fn().mockResolvedValue(EXPECTED_NETWORK),
    });

    await expect(freighterAdapter.connect()).resolves.toEqual({
      address: MOCK_ADDRESS,
      network: EXPECTED_NETWORK,
    });
  });

  it("maps a declined requestAccess to USER_REJECTED", async () => {
    setFreighterApi({
      requestAccess: vi.fn().mockRejectedValue(new Error("User rejected")),
      getPublicKey: vi.fn().mockResolvedValue(MOCK_ADDRESS),
    });

    await expect(freighterAdapter.connect()).rejects.toMatchObject({
      code: "USER_REJECTED",
    });
  });

  it("throws WRONG_NETWORK when the wallet is on another network", async () => {
    setFreighterApi({
      getPublicKey: vi.fn().mockResolvedValue(MOCK_ADDRESS),
      getNetwork: vi.fn().mockResolvedValue("TESTNET"),
    });

    await expect(freighterAdapter.connect()).rejects.toMatchObject({
      code: "WRONG_NETWORK",
    });
  });

  it("throws INVALID_ADDRESS when the wallet returns a malformed key", async () => {
    setFreighterApi({
      getPublicKey: vi.fn().mockResolvedValue("0xdeadbeef"),
      getNetwork: vi.fn().mockResolvedValue(EXPECTED_NETWORK),
    });

    await expect(freighterAdapter.connect()).rejects.toMatchObject({
      code: "INVALID_ADDRESS",
    });
  });

  it("reads the address and network on demand", async () => {
    setFreighterApi({
      getPublicKey: vi.fn().mockResolvedValue(MOCK_ADDRESS),
      getNetwork: vi.fn().mockResolvedValue(EXPECTED_NETWORK),
    });

    await expect(freighterAdapter.getAddress()).resolves.toBe(MOCK_ADDRESS);
    await expect(freighterAdapter.getNetwork()).resolves.toBe(EXPECTED_NETWORK);
    expect(typeof freighterAdapter.onChange(() => {})).toBe("function");
  });

  it("returns null from getAddress without an extension", async () => {
    setFreighterApi(undefined);
    await expect(freighterAdapter.getAddress()).resolves.toBeNull();
  });

  it("throws NOT_INSTALLED from getNetwork without an extension", async () => {
    setFreighterApi(undefined);
    await expect(freighterAdapter.getNetwork()).rejects.toMatchObject({
      code: "NOT_INSTALLED",
    });
  });
});

describe("createMockAdapter", () => {
  it("is deterministic and returns a valid Stellar address", async () => {
    await expect(createMockAdapter().connect()).resolves.toEqual({
      address: MOCK_ADDRESS,
      network: EXPECTED_NETWORK,
    });
    expect(isValidStellarAddress(MOCK_ADDRESS)).toBe(true);
  });

  it("notifies subscribers on account change and stops after unsubscribe", () => {
    const adapter = createMockAdapter();
    const listener = vi.fn();
    const unsubscribe = adapter.onChange(listener);

    adapter.emitAccountChange({ address: MOCK_ADDRESS, network: EXPECTED_NETWORK });
    expect(listener).toHaveBeenCalledWith({
      address: MOCK_ADDRESS,
      network: EXPECTED_NETWORK,
    });

    unsubscribe();
    adapter.emitAccountChange({ address: null });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("surfaces a configured connect error", async () => {
    await expect(
      createMockAdapter({ connectError: new Error("User rejected") }).connect(),
    ).rejects.toMatchObject({ code: "USER_REJECTED" });
  });
});
