import { useState } from 'react';
import OTPInput from '../ui/OTPInput';
import { Alert } from '../ui/Alert';
import { sendOtp, verifyOtp } from '../../api/auth';

interface InlineOtpGateProps {
  onVerified: (sessionToken: string, phone: string) => void;
}

export function InlineOtpGate({ onVerified }: InlineOtpGateProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!phone) {
      setError('Please enter a valid phone number.');
      return;
    }

    // Default to +91 if length is 10 and doesn't start with +
    let formattedPhone = phone.trim();
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    try {
      setLoading(true);
      await sendOtp({ phone: formattedPhone });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue: string) => {
    setError(null);
    let formattedPhone = phone.trim();
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    try {
      setLoading(true);
      const res = await verifyOtp({ phone: formattedPhone, otp: otpValue });
      if (res.verified && res.session_token) {
        onVerified(res.session_token, formattedPhone);
      } else {
        setError('Invalid OTP or not verified.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm w-full mx-auto border border-[#c9a96e]/20 rounded-lg p-6 bg-[#0a0705]">
      <h2 className="text-xl text-[#c9a96e] font-serif mb-2">Sign in to continue</h2>
      <p className="text-white/50 text-sm mb-6">Enter your phone number to receive a one-time password.</p>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-3 bg-[#0a0705] border border-[#c9a96e] rounded-lg text-[#e8dcc8] placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#c9a96e] transition-colors"
              disabled={loading}
              maxLength={15}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#d4b67e] transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerifyOtp}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => handleVerifyOtp(otp)}
            disabled={loading || otp.length < 6}
            className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#d4b67e] transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
             type="button"
             onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
             className="w-full py-2 text-sm text-[#c9a96e] hover:underline"
             disabled={loading}
          >
            Change Phone Number
          </button>
        </div>
      )}
    </div>
  );
}
