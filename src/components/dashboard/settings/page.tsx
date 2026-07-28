import TwoFactorEnroll from '@/components/dashboard/two-factor-enroll';
import { PasswordStrengthMeter } from '@/app/components/password-strength-meter';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400 mb-10">Manage your account security and preferences.</p>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10">
          <h2 className="text-2xl font-semibold mb-8">Security</h2>
          <TwoFactorEnroll onComplete={() => window.location.reload()} />

          <div className='mt-10 border-t border-slate-700 pt-10'>
            <h3 className='text-lg font-medium text-white mb-4'>Change Password</h3>
            <div className='max-w-md'>
              <PasswordStrengthMeter value='' onChange={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}