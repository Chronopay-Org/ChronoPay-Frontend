import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createWalletStore, useWallet, walletStore } from "./useWallet";
import {
  EXPECTED_NETWORK,
  MOCK_ADDRESS,
  WalletError,
  createMockAdapter,
  freighterAdapter,
  type WalletAccountChange,
  type WalletAdapter,
} from "@/lib/wallet/adapter";

const SECOND_ADDRESS = `G${"A".repeat(55)}`;

function fakeAdapter(overrides: Partial<WalletAdapter> = {}): WalletAdapter {
  return {
    id: "fake",
    name: "Fake",
    connect: vi.fn().mockResolvedValue({
      address: MOCK_ADDRESS,
      network: EXPECTED_NETWORK,
    }),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getAddress: vi.fn().mockResolvedValue(MOCK_ADDRESS),
    getNetwork: vi.fn().mockResolvedValue(EXPECTED_NETWORK),
    onChange: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

function captureChangeListener() {
  let emit: ((change: WalletAccountChange) => void) | null = null;
  const adapter = fakeAdapter({
    onChange: vi.fn((listener: (change: WalletAccountChange) => void) => {
      emit = listener;
      return () => {};
    }),
  });
  return {
    adapter,
    emit: (change: WalletAccountChange) => emit?.(change),
    hasListener: () => emit !== null,
  };
}

describe("createWalletStore", () => {
  it("starts disconnected", () => {
    const store = createWalletStore(fakeAdapter());
    expect(store.getState()).toEqual({ status: "disconnected" });
  });

  it("moves through loading to connected with a valid address", async () => {
    const store = createWalletStore(fakeAdapter());

    const pending = store.connect();
    expect(store.getState().status).toBe("loading");

    await pending;
    expect(store.getState()).toEqual({
      status: "connected",
      address: MOCK_ADDRESS,
    });
  });

  it("ignores a connect while one is already in flight", async () => {
    const adapter = fakeAdapter();
    const store = createWalletStore(adapter);

    const pending = store.connect();
    await store.connect();
    await pending;

    expect(adapter.connect).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers on every transition", async () => {
    const store = createWalletStore(fakeAdapter());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    await store.connect();
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    await store.disconnect();
    expect(listener).not.toHaveBeenCalled();
  });

  it("disconnects through the adapter and resets the state", async () => {
    const adapter = fakeAdapter();
    const store = createWalletStore(adapter);
    await store.connect();

    await store.disconnect();

    expect(adapter.disconnect).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({ status: "disconnected" });
  });

  it("surfaces a NOT_INSTALLED adapter error", async () => {
    const store = createWalletStore(
      fakeAdapter({
        connect: vi
          .fn()
          .mockRejectedValue(new WalletError("NOT_INSTALLED", "missing")),
      }),
    );

    await store.connect();

    expect(store.getState()).toMatchObject({
      status: "error",
      errorCode: "NOT_INSTALLED",
      error: "missing",
    });
  });

  it("surfaces a USER_REJECTED adapter error", async () => {
    const store = createWalletStore(
      fakeAdapter({
        connect: vi
          .fn()
          .mockRejectedValue(new WalletError("USER_REJECTED", "declined")),
      }),
    );

    await store.connect();

    expect(store.getState()).toMatchObject({
      status: "error",
      errorCode: "USER_REJECTED",
    });
  });

  it("surfaces a WRONG_NETWORK adapter error", async () => {
    const store = createWalletStore(
      fakeAdapter({
        connect: vi
          .fn()
          .mockRejectedValue(new WalletError("WRONG_NETWORK", "testnet")),
      }),
    );

    await store.connect();

    expect(store.getState()).toMatchObject({
      status: "error",
      errorCode: "WRONG_NETWORK",
    });
  });

  it("rejects an invalid address returned by the adapter", async () => {
    const store = createWalletStore(
      fakeAdapter({
        connect: vi.fn().mockResolvedValue({
          address: "0xdeadbeef",
          network: EXPECTED_NETWORK,
        }),
      }),
    );

    await store.connect();

    expect(store.getState()).toMatchObject({
      status: "error",
      errorCode: "INVALID_ADDRESS",
    });
  });

  it("errors with UNKNOWN when no adapter is configured", async () => {
    const store = createWalletStore(null);

    await store.connect();

    expect(store.getState()).toMatchObject({
      status: "error",
      errorCode: "UNKNOWN",
    });
  });

  it("updates the address on a valid account-change event", async () => {
    const { adapter, emit, hasListener } = captureChangeListener();
    const store = createWalletStore(adapter);

    await store.connect();
    expect(hasListener()).toBe(true);

    emit({ address: SECOND_ADDRESS, network: EXPECTED_NETWORK });

    expect(store.getState()).toEqual({
      status: "connected",
      address: SECOND_ADDRESS,
    });
  });

  it("disconnects when an account-change event reports no address", async () => {
    const { adapter, emit } = captureChangeListener();
    const store = createWalletStore(adapter);
    await store.connect();

    emit({ address: null });

    expect(store.getState()).toEqual({ status: "disconnected" });
  });

  it("errors when an account-change event reports an invalid address", async () => {
    const { adapter, emit } = captureChangeListener();
    const store = createWalletStore(adapter);
    await store.connect();

    emit({ address: "not-a-key" });

    expect(store.getState()).toMatchObject({
      status: "error",
      errorCode: "INVALID_ADDRESS",
    });
  });

  it("resets the state when a new adapter is set", async () => {
    const store = createWalletStore(fakeAdapter());
    await store.connect();

    store.setAdapter(fakeAdapter());

    expect(store.getState()).toEqual({ status: "disconnected" });
  });
});

describe("useWallet", () => {
  beforeEach(() => {
    walletStore.setAdapter(createMockAdapter());
  });

  it("exposes the store state and connects through the adapter", async () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.status).toBe("disconnected");

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.address).toBe(MOCK_ADDRESS);
  });

  it("disconnects back to the disconnected state", async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });
    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.status).toBe("disconnected");
    expect(result.current.address).toBeUndefined();
  });

  it("surfaces the NOT_INSTALLED error from a missing extension", async () => {
    walletStore.setAdapter(freighterAdapter);
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("NOT_INSTALLED");
    expect(result.current.error).toContain("not installed");
  });
});
