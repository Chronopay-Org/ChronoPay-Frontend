import React, { ReactNode } from 'react';

/**
 * LiveRegion renders an invisible element that announces its children to screen readers.
 * It uses aria-live="polite" by default, but can be configured.
 */
export const LiveRegion = ({
  children,
  role = 'status',
  ariaLive = 'polite',
}: {
  children: ReactNode;
  role?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
}) => (
  <div
    role={role}
    aria-live={ariaLive}
    aria-atomic="true"
    className="sr-only"
  >
    {children}
  </div>
);
