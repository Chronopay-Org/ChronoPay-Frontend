import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";
import { ToastProvider } from "@/hooks/use-toast";
import { ToastContainer } from "@/app/components/ui/toast-container";
import { RoleProvider } from "@/app/components/navigation/RoleContext";

export const metadata: Metadata = {
  title: "ChronoPay - Time Economy",
  description: "Tokenize and trade human time on the Stellar network.",
};

/** Runs before React hydrates to set the theme and avoid FOUC. */
const themeInitScript = `
;(function () {
  try {
    var KEY = "chronopay:theme";
    var stored = null;
    try {
      stored = window.localStorage.getItem(KEY);
    } catch (e) { /* ignore storage errors */ }
    var mode = (stored === "light" || stored === "dark" || stored === "auto") ? stored : "auto";
    var resolved = mode;
    if (mode === "auto") {
      resolved = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", resolved);
  } catch (e) { /* fail safe to default theme in globals.css */ }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Determine text direction from locale (defaults to LTR)
  const dir = "ltr"; // TODO: Make dynamic based on locale cookie/header
  const lang = "en"; // TODO: Make dynamic based on locale selection
  
  return (
<html lang={lang} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('chronopay-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){};try{var d=localStorage.getItem('chronopay-density');if(d==='comfortable'||d==='balanced'||d==='compact')document.documentElement.dataset.density=d;}catch(e){}})();`,
          }}
        />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:inset-inline-start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          Skip to content
        </a>

        <ToastProvider>
          <RoleProvider initialRole="buyer">
            {children}
            <ToastContainer />
          </RoleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}