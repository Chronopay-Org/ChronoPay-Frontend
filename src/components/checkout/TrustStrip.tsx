import React from 'react';
import { ShieldCheck, Clock, FileCheck } from 'lucide-react';

interface TrustIndicator {
  id: string;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}

export const TRUST_INDICATORS: TrustIndicator[] = [
  {
    id: 'escrow',
    label: 'Escrow Protection',
    tooltip: 'Your funds are securely held in escrow until the transaction is complete.',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  },
  {
    id: 'dispute',
    label: '14-Day Dispute Window',
    tooltip: 'You have 14 days to raise a dispute if the service or item is not delivered as described.',
    icon: <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  },
  {
    id: 'audit',
    label: 'Audited Smart Contracts',
    tooltip: 'Powered by Stellar smart contracts that have been independently audited for security.',
    icon: <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  },
];

/**
 * TrustStrip
 *
 * Inline trust and safety indicators to be surfaced during the checkout review step.
 * Lists escrow protection, dispute window, and audit signals.
 *
 * - Accessible (WCAG 2.1 AA): Uses native tooltips focusable via keyboard, and a semantic list announced once.
 * - Responsive: Stacks on mobile, inline on larger screens.
 */
export const TrustStrip: React.FC = () => {
  return (
    <section 
      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4"
      aria-label="Trust and Safety Guarantees"
    >
      <ul className="flex flex-col sm:flex-row sm:items-center sm:justify-around gap-4 sm:gap-2">
        {TRUST_INDICATORS.map((indicator) => (
          <li key={indicator.id} className="flex items-center gap-2.5">
            <div className="shrink-0 bg-emerald-100 dark:bg-emerald-500/10 p-1.5 rounded-full">
              {indicator.icon}
            </div>
            <span 
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-help border-b border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-sm"
              title={indicator.tooltip}
              tabIndex={0}
            >
              {indicator.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
