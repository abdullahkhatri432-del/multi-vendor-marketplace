// Client-side UPI display config. The canonical UPI id for order verification
// lives in the server env (UPI_ID); keep these in sync.
export const UPI_CONFIG = {
  upiId: import.meta.env.VITE_UPI_ID || '8160587811@kotak811',
  payeeName: import.meta.env.VITE_UPI_PAYEE_NAME || 'Speedersmania',
  qrImage: '/qr-code.png',
};
