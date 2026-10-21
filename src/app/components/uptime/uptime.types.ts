/**
 * uptime.types.ts
 * Type definitions for the uptime bar chart component.
 * 
 * Supports historical uptime tracking with incident markers.
 */

export interface Incident {
  /** Unique incident identifier */
  id: string;
  
  /** Short incident title or summary */
  title: string;
  
  /** Detailed description of the incident */
  summary: string;
  
  /** Severity level: minor, major, or critical */
  severity: 'minor' | 'major' | 'critical';
  
  /** ISO 8601 timestamp when incident started */
  startedAt: string;
  
  /** ISO 8601 timestamp when incident was resolved (optional for ongoing incidents) */
  resolvedAt?: string;
}

export interface DayData {
  /** Date in ISO 8601 format (YYYY-MM-DD) */
  date: string;
  
  /** Uptime percentage from 0-100 */
  uptimePercent: number;
  
  /** Array of incidents that occurred on this day */
  incidents: Incident[];
}

export interface UptimeCellProps {
  /** Date in ISO 8601 format */
  date: string;
  
  /** Uptime percentage (0-100) */
  uptimePercent: number;
  
  /** Array of incidents for this day */
  incidents: Incident[];
}

export interface UptimeTooltipProps {
  /** Cell element or trigger element for positioning */
  triggerElement?: HTMLElement | null;
  
  /** Whether tooltip is visible */
  isVisible: boolean;
  
  /** Callback when tooltip should be dismissed */
  onDismiss: () => void;
  
  /** Date being displayed */
  date: string;
  
  /** Uptime percentage */
  uptimePercent: number;
  
  /** List of incidents */
  incidents: Incident[];
}

export interface UptimeChartProps {
  /** Name of the component (e.g., "API", "Payments") */
  componentName: string;
  
  /** Array of 90 days of uptime data, newest last */
  days: DayData[];
  
  /** Current uptime percentage to display in summary */
  currentUptimePercent: number;
}
