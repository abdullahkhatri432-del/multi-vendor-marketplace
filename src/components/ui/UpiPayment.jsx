import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Smartphone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const UPI_ID = '8160587811@kotak811';
const PAYEE_NAME = 'Speedersmania';

export const buildUpiUri = (amount) =>
  `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${Number(amount || 0).toFixed(2)}&cu=INR`;

export default function UpiPayment({ amount, upiRef, onUpiRefChange }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, buildUpiUri(amount), {
        width: 220,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      }).catch((err) => console.error('QR generation failed:', err));
    }
  }, [amount]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
    } catch (err) {
      console.warn('Clipboard unavailable:', err);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 rounded-2xl border border-primary-200 bg-primary-50/50 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-5 w-5 text-primary-600" />
          <h4 className="text-sm font-semibold text-surface-900">Pay via UPI</h4>
        </div>
        <p className="text-xs text-surface-500 mb-4">
          Scan with any UPI app (GPay, PhonePe, Paytm) to pay
          <span className="font-semibold text-surface-800"> ₹{Number(amount || 0).toFixed(2)}</span>
        </p>
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <canvas ref={canvasRef} />
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildUpiUri(amount))}`}
            alt="UPI QR Code"
            className="hidden"
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-surface-800">{UPI_ID}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-600 shadow-soft transition-colors hover:bg-primary-600 hover:text-white"
            title="Copy UPI ID"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-5 w-full rounded-xl border border-surface-200 bg-white p-4 text-left">
          <label className="flex items-start gap-2 text-xs font-semibold text-surface-800">
            <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <span>
              UPI Transaction Reference (UTR) — Required to verify your payment
            </span>
          </label>
          <input
            type="text"
            value={upiRef || ''}
            onChange={(e) => onUpiRefChange?.(e.target.value.toUpperCase().trim())}
            placeholder="e.g. 412345678901"
            className="input-field mt-2 py-2.5 text-sm font-mono"
          />
          <p className="mt-1.5 text-[11px] text-surface-400">
            Find your UTR in your UPI app after paying (GPay: &ldquo;UTR&rdquo;, PhonePe: &ldquo;ID&rdquo;). Must be 12–22 characters starting with a digit. Order will not be placed without a valid reference, and each UTR can be used only once.
          </p>
        </div>
        <p className="mt-3 text-[11px] text-surface-400">
          After payment, enter the UTR above, then tap the Pay button below.
        </p>
      </div>
    </div>
  );
}