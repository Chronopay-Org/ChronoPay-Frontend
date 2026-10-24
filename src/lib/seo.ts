import type { Metadata } from "next";

export const SITE_NAME = "ChronoPay";

/** Robots directive for authenticated and shared-link routes that must not be indexed. */
export const NO_INDEX: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
};
