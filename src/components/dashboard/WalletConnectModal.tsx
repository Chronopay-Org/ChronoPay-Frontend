import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FocusTrap } from '@/components/common/FocusTrap';
import { LiveRegion } from '@/components/common/LiveRegion';
import { StatusChip } from '@/components/dashboard/status-chip';
import { Spinner } from '@/app/components/ui/spinner'; // Assume a simple spinner component exists

export type WalletProvider = {
  id: string;
  name: string;
  icon: React.ReactNode; // e.g., <FreighterIcon />
  capabilities?: string[];
  recommended?: boolean;
};

type ConnectionStatus = 'idle' | 'pending' | 'success' | 'error';

interface WalletConnectModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called to close the modal */
  onClose: () => void;
  /** List of available wallet providers */
  providers: WalletProvider[];
  /** Currently selected provider (optional) */
  selectedProviderId?: string;
  /** Current connection status */
  status: ConnectionStatus;
  /** Error message when status === 'error' */
  errorMessage?: string;
  /** Called when the user selects a provider to start connecting */
  onConnect: (providerId: string) => void;
  /** Called when user retries after an error */
  onRetry?: () => void;
}

/**
 * WalletConnectModal
 *
 * - Accessible modal that traps focus and supports Escape to close.
 * - Announces state changes via a hidden live region.
 * - Shows list of providers, a spinner while pending, success chip, and error UI with retry.
 */
export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  providers,
  status,
  errorMessage,
  onConnect,
  onRetry,
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

  // Close on Escape key
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

  // Focus first actionable element when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstButton = modalRef.current.querySelector('button, [tabindex]') as HTMLElement;
      firstButton?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="wallet-connect-title"
    >
      <FocusTrap>
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 p-6 shadow-lg"
        >
          <h2 id="wallet-connect-title" className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Connect Your Stellar Wallet
          </h2>

          {/* Live region for announcements */}
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
            <div className="flex flex-col items-center py-8">
              <Spinner className="h-12 w-12 text-cyan-500" />
              <p className="mt-4 text-slate-800 dark:text-slate-200">Connecting…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-8">
              <StatusChip tone="positive">Connected</StatusChip>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <StatusChip tone="critical">Connection issue</StatusChip>
              <p className="text-sm text-slate-600 dark:text-slate-400">{errorMessage ?? 'Unable to connect.'}</p>
              <button
                type="button"
                className="rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                onClick={onRetry}
              >
                Retry
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
