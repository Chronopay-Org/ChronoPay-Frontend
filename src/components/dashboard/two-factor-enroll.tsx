'use client';

import React, { useState } from 'react';
import { maskRecoveryCode } from '../receipt/masking';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function Button({ children, onClick, disabled = false, className = '' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-6 px-6 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500/10 active:bg-cyan-500/20'
      }`}
    >
      {children}
    </button>
  );
}

export default function TwoFactorEnroll({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'recovery' | 'success'>('intro');
  const [code, setCode] = useState('');
  const [recoveryCodes] = useState(() => 
    Array.from({ length: 10 }, () => 
      Array.from({ length: 8 }, () => Math.random().toString(36)[2]).join('').toUpperCase()
    )
  );
  const [showCodes, setShowCodes] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  const handleVerify = () => {
    if (code.length === 6) {
      setStep('recovery');
    }
  };

  const downloadRecovery = () => {
    const blob = new Blob([`ChronoPay 2FA Recovery Codes\n\n${recoveryCodes.join('\n')}\n\nKeep these codes safe and private.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chronopay-2fa-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printRecovery = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>ChronoPay 2FA Recovery Codes</title></head>
          <body style="font-family: monospace; padding: 2rem;">
            <h2>ChronoPay 2FA Recovery Codes</h2>
            <p>Keep these codes safe and private. Each code can only be used once.</p>
            <div style="font-size: 1.2rem; line-height: 2;">
              ${recoveryCodes.map(c => `<div>${c}</div>`).join('')}
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Set Up Two-Factor Authentication</h2>
        <p className="text-slate-400">Add an extra layer of security to your ChronoPay account.</p>
      </div>

      {step === 'intro' && (
        <>
          <p className="helper-text mb-8 text-center">We&apos;ll guide you through setting up 2FA using a time-based one-time password app.</p>
          <Button onClick={() => setStep('qr')} className="bg-cyan-500 hover:bg-cyan-400 text-black">Begin Setup</Button>
        </>
      )}

      {step === 'qr' && (
        <div className="text-center">
          <div className="mx-auto w-56 h-56 bg-white rounded-2xl flex items-center justify-center mb-6 border-8 border-slate-800">
            <div className="text-slate-900 font-mono text-xs">SCAN QR CODE WITH AUTHENTICATOR APP</div>
          </div>
          <p className="helper-text mb-6">Scan this QR code with Google Authenticator, Authy, or another TOTP app.</p>
          <Button onClick={() => setStep('verify')}>I Have Scanned It</Button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <label className="block text-sm mb-3 font-medium">Enter the 6-digit code from your authenticator app</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-950 border border-slate-700 rounded-xl py-6 focus:border-cyan-400 focus:outline-none"
            placeholder="000000"
          />
          <Button onClick={handleVerify} disabled={code.length !== 6} className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-black">
            Verify Code
          </Button>
        </div>
      )}

      {step === 'recovery' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Save Your Recovery Codes</h3>
          <p className="text-sm text-slate-400 mb-6">
            Store these codes safely. They are the only way to recover access if you lose your device. Each code can only be used once.
          </p>
          
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-sm">Recovery Codes</span>
              <button 
                onClick={() => setShowCodes(!showCodes)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none focus:underline"
                aria-pressed={showCodes}
              >
                {showCodes ? 'Hide All' : 'Reveal All'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              {recoveryCodes.map((code, index) => (
                <div key={index} className="bg-slate-900 py-2 px-4 rounded border border-slate-800 text-center tracking-widest" aria-label={showCodes ? `Recovery code ${index + 1}: ${code}` : `Recovery code ${index + 1} hidden`}>
                  {maskRecoveryCode(code, showCodes)}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={downloadRecovery} className="bg-white text-black hover:bg-white/90">Download</Button>
            <Button onClick={printRecovery} className="bg-slate-800 text-white hover:bg-slate-700 border border-slate-700">Print</Button>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <input 
              type="checkbox" 
              id="confirm-saved"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
            />
            <label htmlFor="confirm-saved" className="text-sm text-slate-300 cursor-pointer select-none">
              I have saved these recovery codes in a safe place.
            </label>
          </div>

          <Button 
            onClick={() => setStep('success')} 
            disabled={!savedConfirmed}
            className="bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            Complete Setup
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">✅</div>
          <h3 className="text-2xl font-semibold mb-3">2FA Enabled Successfully</h3>
          <p className="text-slate-400 mb-8">Your account is now protected with two-factor authentication.</p>
          <Button onClick={onComplete} className="bg-cyan-500 hover:bg-cyan-400 text-black">Return to Settings</Button>
        </div>
      )}
    </div>
  );
}