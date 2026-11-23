import { NextRequest, NextResponse } from "next/server";

export const NONCE_HEADER = "x-nonce";

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function buildCspHeader(
  nonce: string,
  options: { isDev?: boolean } = {}
): string {
  const isDev = options.isDev ?? process.env.NODE_ENV !== "production";

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

export function buildSecurityHeaders(
  nonce: string,
  options: { isDev?: boolean } = {}
): Record<string, string> {
  return {
    "Content-Security-Policy": buildCspHeader(nonce, options),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

export function middleware(request: NextRequest): NextResponse {
  const nonce = generateNonce();
  const securityHeaders = buildSecurityHeaders(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    securityHeaders["Content-Security-Policy"]
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
