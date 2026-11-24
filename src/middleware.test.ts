import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  NONCE_HEADER,
  buildCspHeader,
  buildSecurityHeaders,
  generateNonce,
  middleware,
} from "./middleware";

describe("security headers and CSP middleware", () => {
  describe("generateNonce", () => {
    it("generates a non-empty base64 nonce unique per call", () => {
      const a = generateNonce();
      const b = generateNonce();

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      expect(a).not.toBe(b);
      expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe("buildCspHeader", () => {
    it("includes strict production directives, nonce, and Unsplash image source", () => {
      const csp = buildCspHeader("abc123", { isDev: false });

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data: blob: https://images.unsplash.com");
      expect(csp).toContain("font-src 'self' data:");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("allows unsafe-eval and websockets in development mode", () => {
      const csp = buildCspHeader("dev-nonce", { isDev: true });

      expect(csp).toContain("script-src 'self' 'nonce-dev-nonce' 'strict-dynamic' 'unsafe-eval'");
      expect(csp).toContain("connect-src 'self' ws: wss:");
    });
  });

  describe("buildSecurityHeaders", () => {
    it("returns CSP, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy", () => {
      const headers = buildSecurityHeaders("nonce-xyz", { isDev: false });

      expect(headers["Content-Security-Policy"]).toContain("'nonce-nonce-xyz'");
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["Permissions-Policy"]).toBe(
        "camera=(), microphone=(), geolocation=()"
      );
    });
  });

  describe("middleware", () => {
    it("attaches a per-request nonce and security headers to the response", () => {
      const req1 = new NextRequest("http://localhost:3000/");
      const res1 = middleware(req1);

      const req2 = new NextRequest("http://localhost:3000/marketplace");
      const res2 = middleware(req2);

      const csp1 = res1.headers.get("Content-Security-Policy");
      const csp2 = res2.headers.get("Content-Security-Policy");

      expect(csp1).toBeTruthy();
      expect(csp2).toBeTruthy();
      expect(csp1).not.toBe(csp2);

      expect(res1.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res1.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin"
      );
      expect(res1.headers.get("Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=()"
      );

      // NextResponse.next({ request: { headers } }) encodes forwarded request headers
      const forwardedNonce = res1.headers.get(
        `x-middleware-request-${NONCE_HEADER}`
      );
      expect(forwardedNonce).toBeTruthy();
      expect(csp1).toContain(`'nonce-${forwardedNonce}'`);
    });
  });
});
