import React from 'react';
import Link from 'next/link';
import { formatNumber, formatCurrency, formatDate } from '@/lib/formatters';

export default function FormattersDocsPage() {
  const numberToFormat = 1234567.89;
  const dateToFormat = new Date();

  const examples = [
    { locale: 'en-US', name: 'US English', currency: 'USD', dir: 'ltr' },
    { locale: 'en-IN', name: 'Indian English', currency: 'INR', dir: 'ltr' },
    { locale: 'hi-IN', name: 'Hindi (India)', currency: 'INR', dir: 'ltr' },
    { locale: 'ar-EG', name: 'Arabic (Egypt)', currency: 'EGP', dir: 'rtl' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">Design System - Formatters</span>
          </div>
          <Link
            href="/design-review"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Review
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            i18n Formatters
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Accessible and responsive formatters for numbers, currencies, and dates supporting various locales including RTL and unique grouping (like en-IN).
          </p>
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {examples.map(({ locale, name, currency, dir }) => (
              <div 
                key={locale} 
                className="p-6 rounded-xl border border-white/5 bg-white/5 space-y-4"
                dir={dir}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h2 className="text-xl font-semibold text-slate-200">
                    {name} <span className="text-sm text-slate-400 font-mono">({locale})</span>
                  </h2>
                  {dir === 'rtl' && (
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">RTL</span>
                  )}
                </div>

                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Number format</h3>
                    <p className="text-lg font-mono text-cyan-400">
                      {formatNumber(numberToFormat, locale)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Currency format ({currency})</h3>
                    <p className="text-lg font-mono text-purple-400">
                      {formatCurrency(numberToFormat, currency, locale)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Date format</h3>
                    <p className="text-lg font-mono text-green-400">
                      {formatDate(dateToFormat, locale, { dateStyle: 'full' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
