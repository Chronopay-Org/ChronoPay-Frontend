import React, { useEffect, useRef } from 'react';
import { FocusTrap } from '@/components/common/FocusTrap';
import { LiveRegion } from '@/components/common/LiveRegion';
import { StatusChip } from '@/components/dashboard/status-chip';
import { Spinner } from '@/app/components/ui/spinner'; // Assume a simple spinner component exists

export type WalletProvider = {
  id: string;
  name: string;
  icon: React.ReactNode; // e.g., <FreighterIcon />
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
          className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-6 shadow-lg"
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
            <ul className="space-y-3">
              {providers.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    onClick={() => onConnect(p.id)}
                  >
                    <span className="h-6 w-6">{p.icon}</span>
                    <span className="flex-1 text-left text-slate-800 dark:text-slate-200">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
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
