import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Header } from "./components/Header";
import { ToastProvider } from "@/hooks/use-toast";
import { NotificationsProvider } from "@/components/dashboard/notifications/notifications-provider";
import { ToastContainer } from "@/app/components/ui/toast-container";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { I18nProvider } from "@/lib/i18n";
import { LOCALE_COOKIE_NAME, LOCALE_DIR, resolveLocale } from "@/lib/i18n-config";
import { SiteFooter } from "@/app/components/SiteFooter";
import { DEMO_URL } from "@/lib/site-links";

const SITE_TITLE = "ChronoPay - Time Economy";
const SITE_DESCRIPTION = "Tokenize and trade human time on the Stellar network.";

export const metadata: Metadata = {
  metadataBase: new URL(DEMO_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#07111f",
};

/** Runs before React hydrates to set the theme and avoid FOUC. */
export const themeInitScript = `
;(function () {
  try {
    var KEY = "chronopay:theme";
    var stored = null;
    var scheduleRaw = null;
    try {
      var legacy = window.localStorage.getItem("chronopay-theme");
      if (legacy) {
        if (!window.localStorage.getItem(KEY)) {
          window.localStorage.setItem(KEY, legacy);
        }
        window.localStorage.removeItem("chronopay-theme");
      }
      stored = window.localStorage.getItem(KEY);
      scheduleRaw = window.localStorage.getItem("theme-schedule");
    } catch (e) { /* ignore storage errors */ }
    var mode = (stored === "light" || stored === "dark" || stored === "auto" || stored === "scheduled") ? stored : "auto";
    var resolved = mode;
    if (mode === "auto") {
      resolved = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } else if (mode === "scheduled") {
      var lightTime = "06:00";
      var darkTime = "18:00";
      if (scheduleRaw) {
        try {
          var cfg = JSON.parse(scheduleRaw);
          var timeRe = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
          if (cfg && cfg.type !== "sun" && timeRe.test(cfg.lightTime) && timeRe.test(cfg.darkTime)) {
            lightTime = cfg.lightTime;
            darkTime = cfg.darkTime;
          }
        } catch (e) { /* fall back to default 06:00-18:00 */ }
      }
      var now = new Date();
      var current = now.getHours() * 60 + now.getMinutes();
      var lp = lightTime.split(":");
      var dp = darkTime.split(":");
      var light = parseInt(lp[0], 10) * 60 + parseInt(lp[1], 10);
      var dark = parseInt(dp[0], 10) * 60 + parseInt(dp[1], 10);
      var isDark = false;
      if (light !== dark) {
        isDark = light < dark ? (current >= dark || current < light) : (current >= dark && current < light);
      }
      resolved = isDark ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", resolved);
  } catch (e) { /* fail safe to default theme in globals.css */ }
})();
`;

export default async function RootLayout({
/** Runs before React hydrates to apply the saved density preference. */
export const densityInitScript = `(function(){try{var d=localStorage.getItem('chronopay-density');if(d==='comfortable'||d==='balanced'||d==='compact')document.documentElement.dataset.density=d;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const cookieStore = await cookies();
  const lang = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dir = LOCALE_DIR[lang];
  
  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: densityInitScript,
          }}
        />

        <ToastProvider>
          <NotificationsProvider>
            <I18nProvider locale={lang}>
              <RoleProvider initialRole="buyer">
                <Header />
                {children}
                <SiteFooter />
                <ToastContainer />
              </RoleProvider>
            </I18nProvider>
          </NotificationsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
