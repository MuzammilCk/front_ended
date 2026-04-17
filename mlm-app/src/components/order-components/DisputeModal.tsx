// src/components/order-components/DisputeModal.tsx
// Modal for opening a dispute on an order.

import { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, ChevronDown, AlertCircle } from 'lucide-react';
import {
  openDispute,
  DISPUTE_REASON_LABELS,
  type DisputeReasonCode,
  type OpenDisputePayload,
} from '../../api/trust';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export default function DisputeModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: DisputeModalProps) {
  const [reasonCode, setReasonCode] = useState<DisputeReasonCode | ''>('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReasonCode('');
      setReasonDetail('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reasonCode) {
      setError('Please select a reason for the dispute.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload: OpenDisputePayload = {
      order_id: orderId,
      reason_code: reasonCode,
      reason_detail: reasonDetail.trim() || undefined,
      idempotency_key: crypto.randomUUID?.() ?? `dsp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };

    try {
      await openDispute(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.body ?? err?.message ?? 'Failed to submit dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[#0d0a07] border border-[#c9a96e]/15 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col animate-[slideUp_300ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#c9a96e]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[#e8dcc8]">Report an Issue</h3>
              <p className="text-[9px] uppercase tracking-widest text-[#c9a96e]/50">
                Order #{orderId.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#e8dcc8]/50" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Info banner */}
          <div className="flex gap-3 p-3 rounded-lg bg-[#c9a96e]/5 border border-[#c9a96e]/10">
            <AlertTriangle className="w-4 h-4 text-[#c9a96e] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#e8dcc8]/60 leading-relaxed">
              Our team will investigate your issue and respond within 24–48 hours.
              You'll receive updates via your registered phone number.
            </p>
          </div>

          {/* Reason Select */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#c9a96e]/60 mb-2">
              Issue Type
            </label>
            <div className="relative">
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as DisputeReasonCode)}
                className="w-full appearance-none bg-[#0a0705] border border-[#c9a96e]/15 rounded-lg px-4 py-3 text-sm text-[#e8dcc8] focus:outline-none focus:border-[#c9a96e]/40 transition-colors"
              >
                <option value="">Select an issue…</option>
                {(Object.entries(DISPUTE_REASON_LABELS) as [DisputeReasonCode, string][]).map(
                  ([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a96e]/40 pointer-events-none" />
            </div>
          </div>

          {/* Detail textarea */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#c9a96e]/60 mb-2">
              Describe the Issue
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Please provide details about the issue you're experiencing…"
              className="w-full bg-[#0a0705] border border-[#c9a96e]/15 rounded-lg px-4 py-3 text-sm text-[#e8dcc8] placeholder:text-[#e8dcc8]/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors resize-none"
            />
            <p className="text-[9px] text-[#e8dcc8]/20 text-right mt-1">
              {reasonDetail.length}/2000
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#c9a96e]/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-lg border border-[#c9a96e]/15 text-xs uppercase tracking-widest text-[#e8dcc8]/60 hover:text-[#e8dcc8] hover:border-[#c9a96e]/30 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reasonCode}
            className="flex-1 py-3 rounded-lg bg-amber-500/90 text-[#0a0705] text-xs uppercase tracking-widest font-medium hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}
