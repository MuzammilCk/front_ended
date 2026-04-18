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
    <div className="w-full">
      <h2 className="font-display text-2xl text-[#e8dcc8] font-light mb-2">One moment</h2>
      <p className="text-[10px] uppercase tracking-widest text-[#e8dcc8]/40 mb-8">Enter your mobile to receive a verification code</p>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="relative pt-4 mb-6">
            <input
              type="tel"
              id="otp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=" "
              disabled={loading}
              maxLength={15}
              className="peer w-full bg-transparent border-b border-white/15 focus:border-[#c9a96e] text-[#e8dcc8] text-sm pb-2 pt-1 focus:outline-none transition-colors duration-500 placeholder-transparent"
            />
            <label
              htmlFor="otp-phone"
              className="absolute left-0 top-4 text-sm text-[#e8dcc8]/40 transition-all duration-300 peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#c9a96e]/60 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest"
            >
              Mobile Number
            </label>
          </div>
          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-3 bg-[#c9a96e] text-[#0a0705] text-xs uppercase tracking-widest font-medium hover:bg-[#d4b97e] transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : 'Send Code'}
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
            className="w-full py-3 mt-4 bg-[#c9a96e] text-[#0a0705] text-xs uppercase tracking-widest font-medium hover:bg-[#d4b97e] transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
            disabled={loading}
            className="w-full pt-2 text-[10px] uppercase tracking-widest text-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors duration-500"
          >
            Change number
          </button>
        </div>
      )}
    </div>
  );
}
