import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FocusTrap } from '@/components/common/FocusTrap';
import { LiveRegion } from '@/components/common/LiveRegion';
import { StatusChip } from '@/components/dashboard/status-chip';
import { Spinner } from '@/app/components/ui/spinner';

export type WalletProvider = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

type ConnectionStatus = 'idle' | 'pending' | 'success' | 'error';

type ConnectionMethod = 'wallet' | 'email';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: WalletProvider[];
  status: ConnectionStatus;
  errorMessage?: string;
  onConnect: (providerId: string) => void;
  onRetry?: () => void;
  onEmailSubmit?: (email: string) => void;
}

const LOCAL_STORAGE_KEY = 'chronopay-preferred-connection-method';

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  providers,
  status,
  errorMessage,
  onConnect,
  onRetry,
  onEmailSubmit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedMethod, setSelectedMethod] = useState<ConnectionMethod | undefined>(undefined);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY) as ConnectionMethod | null;
    setSelectedMethod(stored ?? undefined);
    setEmail('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstButton = modalRef.current.querySelector('button, input') as HTMLElement;
      firstButton?.focus();
    }
  }, [isOpen, selectedMethod]);

  const emailValid = useMemo(() => /
    ^[^\s@]+@[^\s@]+\.[^\s@]+$
  /.test(email), [email]);

  const selectMethod = (method: ConnectionMethod) => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, method);
    setSelectedMethod(method);
  };

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailValid) return;
    onEmailSubmit?.(email);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 sm:px-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby="wallet-connect-title"
    >
      <FocusTrap>
        <div
          ref={modalRef}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-950 p-6 shadow-2xl"
        >
          <h2 id="wallet-connect-title" className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Choose how to connect
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Pick a path that fits your workflow. You can add the other option later.
          </p>

          <LiveRegion>
            {status === 'pending' && 'Connecting to wallet…'}
            {status === 'success' && 'Wallet connected successfully.'}
            {status === 'error' && `Connection failed: ${errorMessage || 'Unknown error'}`}
          </LiveRegion>

          {status === 'idle' && !selectedMethod && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900"
                onClick={() => selectMethod('wallet')}
                aria-label="Connect with your Stellar wallet"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">W</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Connect Stellar wallet</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Securely sign in with a Stellar wallet and keep your time tokens in a wallet you control.
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-cyan-500">
                  Recommended
                </p>
              </button>

              <button
                type="button"
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900"
                onClick={() => selectMethod('email')}
                aria-label="Continue with email"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">@</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Continue with email</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Use email for a fast start. You can connect a wallet later to access Stellar payouts.
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                  Add wallet later
                </p>
              </button>
            </div>
          )}

          {status === 'idle' && selectedMethod === 'wallet' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Wallet providers</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Choose a Stellar wallet to finish connecting.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
                  onClick={() => setSelectedMethod(undefined)}
                >
                  Back
                </button>
              </div>

              <div className="space-y-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950"
                    onClick={() => onConnect(provider.id)}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      {provider.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{provider.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Connect with your existing Stellar wallet provider.
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                If you do not have a wallet yet, you can continue with email and add one later.
              </p>
            </div>
          )}

          {status === 'idle' && selectedMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Continue with email</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Receive a secure login link and connect a Stellar wallet later from your dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
                  onClick={() => setSelectedMethod(undefined)}
                >
                  Back
                </button>
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email address
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-describedby="email-help"
                  required
                />
              </label>

              <p id="email-help" className="text-sm text-slate-500 dark:text-slate-400">
                You'll get a secure sign-in link. This is not a wallet connection, but it lets you start now.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="submit"
                  disabled={!emailValid}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:pointer-events-none hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Send sign-in link
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add a wallet later to access Stellar payouts and token minting.
                </p>
              </div>
            </form>
          )}

          {status !== 'idle' && status !== 'pending' && selectedMethod === undefined && (
            <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Choose a connection path above to continue.
            </div>
          )}

          {status === 'pending' && (
            <div className="mt-6 flex flex-col items-center justify-center gap-4 py-10">
              <Spinner className="h-12 w-12 text-cyan-500" />
              <p className="text-sm text-slate-700 dark:text-slate-200">Connecting to your wallet…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 flex flex-col items-center gap-4 py-10">
              <StatusChip tone="positive">Connected</StatusChip>
              <p className="text-sm text-slate-700 dark:text-slate-200">Your wallet is ready. You can manage connection preferences in settings.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 flex flex-col items-center gap-4 py-10">
              <StatusChip tone="critical">Connection issue</StatusChip>
              <p className="text-sm text-slate-700 dark:text-slate-200">{errorMessage ?? 'Unable to connect.'}</p>
              <button
                type="button"
                className="rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                onClick={onRetry}
              >
                Retry connection
              </button>
            </div>
          )}

          <button
            type="button"
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close modal"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </FocusTrap>
    </div>
  );
};
