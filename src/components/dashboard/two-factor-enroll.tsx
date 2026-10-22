'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { maskRecoveryCode } from '../receipt/masking';

export interface TwoFactorAdapter {
  startEnrollment: () => Promise<{ otpauthUri: string; secret: string }>;
  verifyCode: (code: string) => Promise<boolean>;
  getRecoveryCodes: () => Promise<string[]>;
}

interface TwoFactorEnrollProps {
  onComplete?: () => void;
  adapter?: TwoFactorAdapter;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

function Button({ children, onClick, disabled = false, className = '', autoFocus }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`w-full py-4 px-6 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500/10 active:bg-cyan-500/20'
      }`}
    >
      {children}
    </button>
  );
}

// --- Demo Adapter Implementation (RFC 6238 & CSPRNG) ---
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateCSPRNGSecret(length = 16): string {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET[randomBytes[i] % ALPHABET.length];
  }
  return result;
}

function generateCSPRNGRecoveryCodes(count = 10, length = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++ ) {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    let code = '';
    for (let j = 0; j < length; j++) {
      code += ALPHABET[randomBytes[j] % ALPHABET.length];
    }
    codes.push(code);
  }
  return codes;
}

// Base32 Decoder for RFC 6238 verification in demo mode
function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  let outputLength = (cleaned.length * 5) / 8 | 0;
  const output = new Uint8Array(outputLength);
  let index = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const idx = ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}

async function hmacSha1(key: Uint8Array, counter: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counter);
  return new Uint8Array(signature);
}

async function verifyTOTPLocal(secret: string, token: string, windowSteps = 1): Promise<boolean> {
  try {
    const keyBytes = base32ToBytes(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const step = 30;
    const currentCounter = Math.floor(epoch / step);

    for (let i = -windowSteps; i <= windowSteps; i++) {
      const counterVal = currentCounter + i;
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint32(4, counterVal, false); // Big endian

      const hmacResult = await hmacSha1(keyBytes, new Uint8Array(buffer));
      const offset = hmacResult[hmacResult.length - 1] & 0x0f;
      const binary =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      if (otp === token) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export default function TwoFactorEnroll({ onComplete, adapter }: TwoFactorEnrollProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'recovery' | 'success'>('intro');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [secret, setSecret] = useState('');
  const [otpauthUri, setOtpauthUri] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Default Demo Adapter if none provided
  const activeAdapter: TwoFactorAdapter = adapter || {
    startEnrollment: async () => {
      const sec = generateCSPRNGSecret();
      const uri = `otpauth://totp/ChronoPay:user@chronopay.com?secret=${sec}&issuer=ChronoPay`;
      return { otpauthUri: uri, secret: sec };
    },
    verifyCode: async (enteredCode: string) => {
      return await verifyTOTPLocal(secret, enteredCode);
    },
    getRecoveryCodes: async () => {
      return generateCSPRNGRecoveryCodes(10, 8);
    }
  };

  useEffect(() => {
    if (step === 'verify' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleBeginSetup = async () => {
    setLoading(true);
    setNetworkError('');
    try {
      const res = await activeAdapter.startEnrollment();
      setSecret(res.secret);
      setOtpauthUri(res.otpauthUri);
      setStep('qr');
    } catch {
      setNetworkError('Failed to initialize 2FA enrollment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setErrorMsg('');
    setNetworkError('');
    if (code.length !== 6) return;

    setLoading(true);
    try {
      const isValid = await activeAdapter.verifyCode(code);
      if (isValid) {
        // Fetch recovery codes before proceeding to recovery step
        const codes = await activeAdapter.getRecoveryCodes();
        setRecoveryCodes(codes);
        setStep('recovery');
      } else {
        setErrorMsg('Invalid verification code. Please check your app and try again.');
      }
    } catch {
      setNetworkError('Network error during code verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setNetworkError('');
    setCode(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code.length === 6 && !loading) {
      handleVerify();
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
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-8 text-slate-100 shadow-xl" role="region" aria-label="Two-Factor Authentication Enrollment">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Set Up Two-Factor Authentication</h2>
        <p className="text-slate-400">Add an extra layer of security to your ChronoPay account.</p>
      </div>

      {networkError && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-sm" role="alert">
          {networkError}
        </div>
      )}

      {step === 'intro' && (
        <>
          <p className="helper-text mb-8 text-center text-slate-300">We&apos;ll guide you through setting up 2FA using a time-based one-time password app.</p>
          <Button onClick={handleBeginSetup} disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
            {loading ? 'Initializing...' : 'Begin Setup'}
          </Button>
        </>
      )}

      {step === 'qr' && (
        <div className="text-center">
          <div className="mx-auto w-56 h-56 bg-white rounded-2xl flex flex-col items-center justify-center p-4 mb-6 border-8 border-slate-800" aria-label="QR Code Container">
            {/* QR Visual Representation / Placeholder encoding otpauthUri */}
            <div className="text-slate-900 font-mono text-[10px] break-all max-h-36 overflow-hidden mb-2 p-2 bg-slate-100 rounded">
              {otpauthUri}
            </div>
            <span className="text-slate-500 text-xs font-semibold">SCAN WITH AUTHENTICATOR APP</span>
          </div>

          <div className="mb-6 text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="block text-xs font-medium text-slate-400 mb-1">Manual Setup Key:</span>
            <div className="flex items-center justify-between font-mono text-sm text-cyan-300">
              <span className="tracking-wider">{secret}</span>
              <button
                type="button"
                onClick={handleCopySecret}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 py-1 px-3 rounded-lg border border-slate-700 transition-colors"
              >
                {copiedSecret ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="helper-text mb-6 text-slate-300 text-sm">Scan this QR code with Google Authenticator, Authy, or another TOTP app.</p>
          <Button onClick={() => setStep('verify')} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
            I Have Scanned It
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <label htmlFor="auth-code" className="block text-sm mb-3 font-medium text-slate-200">Enter the 6-digit code from your authenticator app</label>
          <input
            id="auth-code"
            ref={inputRef}
            type="text"
            maxLength={6}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? "error-msg" : undefined}
            className={`w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-950 border ${errorMsg ? 'border-red-500' : 'border-slate-700'} rounded-xl py-6 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-slate-100`}
            placeholder="000000"
          />
          {errorMsg && <p id="error-msg" className="mt-2 text-red-400 text-sm" role="alert">{errorMsg}</p>}
          <Button 
            onClick={handleVerify} 
            disabled={code.length !== 6 || loading} 
            className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </div>
      )}

      {step === 'recovery' && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-slate-100">Save Your Recovery Codes</h3>
          <p className="text-sm text-slate-400 mb-6">
            Store these codes safely. They are the only way to recover access if you lose your device. Each code can only be used once.
          </p>
          
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-sm text-slate-200">Recovery Codes</span>
              <button 
                type="button"
                onClick={() => setShowCodes(!showCodes)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none focus:underline"
                aria-pressed={showCodes}
              >
                {showCodes ? 'Hide All' : 'Reveal All'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              {recoveryCodes.map((c, index) => (
                <div key={index} className="bg-slate-900 py-2 px-4 rounded border border-slate-800 text-center tracking-widest text-slate-300" aria-label={showCodes ? `Recovery code ${index + 1}: ${c}` : `Recovery code ${index + 1} hidden`}>
                  {maskRecoveryCode(c, showCodes)}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={downloadRecovery} className="bg-white text-black hover:bg-white/90 font-semibold">Download</Button>
            <Button onClick={printRecovery} className="bg-slate-800 text-white hover:bg-slate-700 border border-slate-700">Print</Button>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <input 
              type="checkbox" 
              id="confirm-saved"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-900 focus:outline-none focus-visible:ring-2 cursor-pointer"
            />
            <label htmlFor="confirm-saved" className="text-sm text-slate-300 cursor-pointer select-none">
              I have saved these recovery codes in a safe place.
            </label>
          </div>

          <Button 
            onClick={() => setStep('success')} 
            disabled={!savedConfirmed}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:bg-slate-700 disabled:text-slate-500"
          >
            Complete Setup
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-6" role="img" aria-label="Success">✅</div>
          <h3 className="text-2xl font-semibold mb-3 text-slate-100">2FA Enabled Successfully</h3>
          <p className="text-slate-400 mb-8">Your account is now protected with two-factor authentication.</p>
          <Button onClick={onComplete} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">Return to Settings</Button>
        </div>
      )}
    </div>
  );
}
