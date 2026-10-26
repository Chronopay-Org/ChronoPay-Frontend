import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReceiptPage, { metadata as receiptMetadata } from "../app/dashboard/slots/[id]/receipt/page";

describe("Receipt Page", () => {
  it("exports metadata with noindex for shared receipt", () => {
    expect(receiptMetadata).toHaveProperty("title", "Receipt");
    expect(receiptMetadata.robots).toEqual({ index: false, follow: false });
  });
});
