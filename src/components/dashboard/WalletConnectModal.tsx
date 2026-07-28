import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { FocusTrap } from '@/components/common/FocusTrap';
import { LiveRegion } from '@/components/common/LiveRegion';
import { StatusChip } from '@/components/dashboard/status-chip';
import { SigningSkeleton } from '@/components/checkout/SigningSkeleton';

export type WalletProvider = {
  id: string;
  name: string;
  icon: React.ReactNode; // e.g., <FreighterIcon />
  capabilities?: string[];
  recommended?: boolean;
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
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ConnectionMethod | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY) as ConnectionMethod | null;
    setSelectedMethod(stored ?? undefined);
    setEmail('');
  }, [isOpen]);

  const allCaps = useMemo(() => {
    const caps = new Set<string>();
    providers.forEach(p => p.capabilities?.forEach(c => caps.add(c)));
    return Array.from(caps);
  }, [providers]);

  const toggleCap = (cap: string) => {
    setSelectedCaps(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  const filteredProviders = useMemo(() => {
    if (selectedCaps.length === 0) return providers;
    return providers.filter(p =>
      selectedCaps.every(cap => p.capabilities?.includes(cap))
    );
  }, [providers, selectedCaps]);

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

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const emailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  const selectMethod = useCallback((method: ConnectionMethod) => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, method);
    setSelectedMethod(method);
  }, []);

  const handleConnect = useCallback((providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    setSelectedProviderName(provider?.name);
    onConnect(providerId);
  }, [providers, onConnect]);

  const handleEmailSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailValid) return;
    onEmailSubmit?.(email);
  }, [emailValid, email, onEmailSubmit]);

  const handleCancelSigning = useCallback(() => {
    setSelectedMethod(null);
    setSelectedProviderName(undefined);
    onClose();
  }, [onClose]);

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
          className="elevation-4 relative w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900"
        >
          <h2 id="wallet-connect-title" className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Choose how to connect
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Pick a path that fits your workflow. You can add the other option later.
          </p>

          <LiveRegion>
            {status === 'pending' && selectedProviderName
              ? `Waiting for signature in ${selectedProviderName}…`
              : status === 'pending'
                ? 'Connecting to wallet…'
                : null}
            {status === 'success' && 'Wallet connected successfully.'}
            {status === 'error' && `Connection failed: ${errorMessage || 'Unknown error'}`}
          </LiveRegion>

          {/* Content based on status */}
          {status === 'idle' && !selectedMethod && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 dark:border-slate-700 dark:bg-slate-800/50"
                onClick={() => selectMethod('wallet')}
                aria-label="Connect Stellar wallet"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white font-semibold text-sm">W</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Connect Stellar wallet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Sign in with a Stellar wallet.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Recommended
                </p>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 dark:border-slate-700 dark:bg-slate-800/50"
                onClick={() => selectMethod('email')}
                aria-label="Continue with email"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white font-semibold text-sm">@</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Continue with email</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Use email for a quick start.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Add wallet later
                </p>
              </button>
            </div>
          )}

          {status === 'idle' && selectedMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Continue with email</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Receive a secure sign-in link via email.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
                  onClick={() => setSelectedMethod(undefined)}
                >
                  Back
                </button>
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email address
                <input
                  type="email"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={!emailValid}
                className="w-full rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Send sign-in link
              </button>
            </form>
          )}

          {status === 'idle' && selectedMethod === 'wallet' && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select a provider
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
                  onClick={() => setSelectedMethod(undefined)}
                >
                  Back
                </button>
              </div>

              {/* Filter chips */}
              {allCaps.length > 0 && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by capabilities">
                  {allCaps.map(cap => {
                    const isSelected = selectedCaps.includes(cap);
                    return (
                      <button
                        key={cap}
                        onClick={() => toggleCap(cap)}
                        aria-pressed={isSelected}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          isSelected
                            ? 'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cap}
                      </button>
                    )
                  })}
                </div>
              )}
              
              {/* Matrix List */}
              {filteredProviders.length > 0 ? (
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 sm:gap-3">
                  {filteredProviders.map(p => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:px-4 sm:py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 text-slate-700 dark:text-slate-300 flex-shrink-0">{p.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {p.name}
                            {p.recommended && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 uppercase tracking-wider">
                                Recommended
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap sm:justify-end gap-1.5">
                        {p.capabilities?.map(cap => (
                          <span key={cap} className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {cap}
                          </span>
                        )) || <span className="text-xs text-slate-400">-</span>}
                      </div>

                      <div className="mt-2 sm:mt-0 sm:text-right">
                        <button
                          type="button"
                          onClick={() => handleConnect(p.id)}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
                          aria-label={`Connect to ${p.name}`}
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  No wallets match the selected capabilities.
                </div>
              )}
            </div>
          )}

          {status === 'pending' && (
            <SigningSkeleton
              walletName={selectedProviderName}
              onCancel={handleCancelSigning}
            />
          )}

          {status === 'success' && (
            <div
              className={`mt-6 flex flex-col items-center gap-4 py-8 px-4 text-center ${
                prefersReducedMotion
                  ? 'transition-opacity duration-200 ease-in-out opacity-100'
                  : 'animate-in fade-in zoom-in-95 duration-300'
              }`}
              data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
            >
              {prefersReducedMotion ? (
                /* Reduced Motion Alternative: Static success mark with crossfade, no scale/bounce/spin/ping */
                <div
                  data-testid="reduced-motion-success-mark"
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                /* Standard Motion: Animated success mark with subtle spring/pulse */
                <div
                  data-testid="standard-motion-success-mark"
                  className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                  <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping duration-1000 opacity-75" />
                  <svg
                    className="w-8 h-8 relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              <StatusChip tone="positive">Connected</StatusChip>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Wallet Connected Successfully
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                  Your wallet is ready. You can manage connection preferences in settings.
                </p>
              </div>
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
