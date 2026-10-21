/**
 * Illustration Components
 * 
 * Barrel export for empty booking state illustrations.
 * Each illustration is role-specific (buyer, supplier, admin) and supports
 * light/dark mode via CSS variables and Tailwind classes.
 */

export { EmptyBookingsBuyer } from "./empty-bookings-buyer";
export { EmptyBookingsSupplier } from "./empty-bookings-supplier";
export { EmptyBookingsAdmin } from "./empty-bookings-admin";
export { ILLUSTRATION_TOKENS, ILLUSTRATION_CSS_VARS, ROLE_COLOR_SCHEMES } from "./illustration-tokens";

export type { EmptyBookingsBuyerProps } from "./empty-bookings-buyer";
export type { EmptyBookingsSupplierProps } from "./empty-bookings-supplier";
export type { EmptyBookingsAdminProps } from "./empty-bookings-admin";
