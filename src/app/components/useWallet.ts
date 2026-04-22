import { useCallback, useEffect, useState } from "react";

type WalletStatus = "connected" | "disconnected" | "loading" | "error";

type WalletState = {
  status: WalletStatus;
  address?: string;
  error?: string;
};

let walletState: WalletState = { status: "disconnected" };
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function setWalletState(next: WalletState) {
  walletState = next;
  notifySubscribers();
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(walletState);

  useEffect(() => {
    const subscriber = () => setState(walletState);
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  const connect = useCallback(() => {
    if (walletState.status === "loading") return;
    setWalletState({ status: "loading" });

    window.setTimeout(() => {
      setWalletState({
        status: "connected",
        address: "0x12a4F9b3c7D8e9A1fB2C",
      });
    }, 700);
  }, []);

  const disconnect = useCallback(() => {
    setWalletState({ status: "disconnected" });
  }, []);

  return {
    status: state.status as WalletStatus,
    address: state.address,
    error: state.error,
    connect,
    disconnect,
  };
}
