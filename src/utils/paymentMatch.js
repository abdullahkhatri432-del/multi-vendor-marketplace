// Pure UTR + amount matching logic for payment verification (Phase 3).
// Strips formatting, normalizes UTRs, and matches against declared payments.

export const normalizeUtr = (raw) => {
  const r = String(raw || '').trim().toUpperCase();
  return r.replace(/[^A-Z0-9]/g, '');
};

// Real Indian bank UTRs / UPI refs are 12–22 alphanumeric chars and start with a digit.
export const isValidUtrFormat = (raw) => {
  const r = normalizeUtr(raw);
  return r.length >= 12 && r.length <= 22 && /^[0-9]/.test(r);
};

export const normalizeAmount = (raw) => {
  const num = parseFloat(String(raw || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
};

// Parse lines like:
//   412345678901
//   412345678901 1499
//   412345678901,1499
//   NEFT 412345678901 Rs 1499.00 05-Aug-26
export const parseUtrLines = (text) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const entries = [];
  for (const line of lines) {
    // Extract any 12+ alphanumeric UTR-like token (letters+digits, common UPI/NEFT refs)
    const utrMatch = line.match(/([A-Z0-9]{12,})/i);
    if (!utrMatch) continue;
    const utr = normalizeUtr(utrMatch[1]);
    if (utr.length < 12) continue;

    // Extract amount from the REST of the line (excluding the UTR token itself)
    const rest = line.replace(utrMatch[1], ' ');
    const amountMatch = rest.match(/(\d+\.\d{2}|\d+)/);
    let amount = amountMatch ? normalizeAmount(amountMatch[1]) : null;

    entries.push({ utr, amount, raw: line });
  }
  return entries;
};

// orders: array of order docs (must have paymentReference and total)
// bankUtrs: parsed entries from admin paste
// Returns: { matched: [...], unmatched: [...] }
export const matchPayments = (orders, bankUtrs) => {
  const candidates = orders.filter(
    (o) =>
      o.paymentReference &&
      ['paid', 'advance-paid', 'pending', 'pending-verification'].includes(o.paymentStatus || '') &&
      o.paymentStatus !== 'verified'
  );

  const bankUtrSet = new Map();
  for (const e of bankUtrs) {
    if (!bankUtrSet.has(e.utr)) bankUtrSet.set(e.utr, e);
  }

  const matched = [];
  const unmatched = [];

  for (const order of candidates) {
    const orderUtr = normalizeUtr(order.paymentReference);
    const bankEntry = bankUtrSet.get(orderUtr);

    if (bankEntry) {
      // If bank entry has an amount, require exact amount match.
      const orderAmount = normalizeAmount(order.paymentMethod === 'cod' ? order.advanceAmount : order.total);
      const amountMatches =
        bankEntry.amount == null ||
        (orderAmount != null && Math.abs(bankEntry.amount - orderAmount) < 0.01);

      matched.push({ order, bankEntry, amountMatches, reason: amountMatches ? 'utr+amount' : 'utr-only' });
    } else {
      unmatched.push(order);
    }
  }

  return { matched, unmatched };
};

export const matchFromPaste = (orders, pasteText) => {
  const parsed = parseUtrLines(pasteText);
  return { entries: parsed, ...matchPayments(orders, parsed) };
};