import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";
import { ToastProvider } from "@/hooks/use-toast";
import { ToastContainer } from "@/app/components/ui/toast-container";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "ChronoPay - Time Economy",
  description: "Tokenize and trade human time on the Stellar network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('chronopay-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){};try{var d=localStorage.getItem('chronopay-density');if(d==='comfortable'||d==='balanced'||d==='compact')document.documentElement.dataset.density=d;}catch(e){}})();`,
          }}
        />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          Skip to content
        </a>

        <ToastProvider>
          <I18nProvider>
            <RoleProvider initialRole="buyer">
              {children}
              <ToastContainer />
            </RoleProvider>
          </I18nProvider>
        </ToastProvider>
      </body>
    </html>
  );
}