import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FocusTrap } from '@/components/common/FocusTrap';
import { LiveRegion } from '@/components/common/LiveRegion';
import { StatusChip } from '@/components/dashboard/status-chip';
import { Spinner } from '@/app/components/ui/spinner';

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
          className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 p-6 shadow-lg"
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

          {/* Content based on status */}
          {status === 'idle' && (
            <div className="space-y-4">
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
                  <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <div>Wallet</div>
                    <div>Capabilities</div>
                    <div className="text-right">Action</div>
                  </div>
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
                          onClick={() => onConnect(p.id)}
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
