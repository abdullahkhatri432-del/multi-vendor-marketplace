// Small client for the serverless API. All mutating calls are authenticated
// with the Firebase ID token; the server re-checks roles and ownership.
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export const ORDER_STATUS_ENDPOINT = `${API_BASE}/order-status`;
export const REVIEWS_ENDPOINT = `${API_BASE}/reviews`;

/**
 * POST JSON with the current user's ID token.
 * Throws an Error with the server's message so callers can surface it.
 */
export async function postAuthedJson(url, body, user) {
  if (!user) throw new Error('Please sign in to continue.');
  const idToken = await user.getIdToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body || {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export async function deleteAuthedJson(url, body, user) {
  if (!user) throw new Error('Please sign in to continue.');
  const idToken = await user.getIdToken();
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body || {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export const updateOrderStatus = (user, payload) =>
  postAuthedJson(ORDER_STATUS_ENDPOINT, payload, user);

export const cancelOrder = (user, orderId, note) =>
  postAuthedJson(ORDER_STATUS_ENDPOINT, { orderId, action: 'cancel', note }, user);

export const saveReview = (user, { productId, rating, comment }) =>
  postAuthedJson(REVIEWS_ENDPOINT, { productId, rating, comment }, user);
