import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/hooks/use-toast";
import { ToastContainer } from "@/app/components/ui/toast-container";
import LocalePicker from "@/app/components/ui/locale-picker";

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
            __html: `(function(){try{var t=localStorage.getItem('chronopay-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          Skip to content
        </a>

        <ToastProvider>
          <main id="main-content" className="flex-1">
            {children}
          </main>

          <footer className="border-t border-white/10 px-6 py-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <p className="text-sm text-slate-400">
                © ChronoPay
              </p>

              <LocalePicker />
            </div>
          </footer>

          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}