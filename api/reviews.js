// Review endpoint — the only writer for the `reviews` collection.
//
// Why server-side: a browser must not be able to invent a "Verified Purchase"
// badge or a 5-star rating. This endpoint verifies the signed-in customer
// actually bought the product (in a non-cancelled order), stores one review per
// customer per product (deterministic id), and recomputes the product's rating
// aggregates in the same transaction.
const {
  HttpError,
  getDb,
  authenticate,
  applyCors,
  rateLimit,
  FieldValue,
} = require('../lib/http.cjs');

const MAX_COMMENT = 2000;
const round1 = (n) => Math.round(n * 10) / 10;
const isRating = (value) => Number.isFinite(value) && value >= 1 && value <= 5;

const reviewIdFor = (productId, uid) => `${productId}__${uid}`;

function parseBody(body) {
  const productId = String(body.productId || '').trim().slice(0, 128);
  if (!productId) throw new HttpError(400, 'Missing product id.');

  const rating = Math.trunc(Number(body.rating));
  if (!isRating(rating)) {
    throw new HttpError(400, 'Please choose a rating between 1 and 5 stars.');
  }

  const comment = String(body.comment || '').trim().slice(0, MAX_COMMENT);
  if (comment.length < 3) {
    throw new HttpError(400, 'Please write a short review (at least 3 characters).');
  }

  return { productId, rating, comment };
}

// Average of every stored review for the product, replacing the caller's own
// pending rating (or dropping it when the caller is deleting their review).
function aggregate(reviewsSnap, ownReviewId, pendingRating) {
  const ratings = reviewsSnap.docs
    .filter((doc) => doc.id !== ownReviewId)
    .map((doc) => Number(doc.data().rating))
    .filter(isRating);

  if (isRating(pendingRating)) ratings.push(pendingRating);

  if (!ratings.length) return { rating: 0, reviewCount: 0 };
  return {
    rating: round1(ratings.reduce((sum, value) => sum + value, 0) / ratings.length),
    reviewCount: ratings.length,
  };
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    rateLimit(req, { limit: 10, windowMs: 60_000, scope: 'reviews' });

    const db = getDb();
    const token = await authenticate(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const productId = String(body.productId || '').trim().slice(0, 128);
    if (!productId) throw new HttpError(400, 'Missing product id.');

    const productRef = db.collection('products').doc(productId);
    const reviewRef = db.collection('reviews').doc(reviewIdFor(productId, token.uid));
    const reviewsQuery = db.collection('reviews').where('productId', '==', productId);

    if (req.method === 'DELETE') {
      const result = await db.runTransaction(async (transaction) => {
        // ---- reads first (Firestore transactions forbid reads after writes) --
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists) throw new HttpError(404, 'Product not found.');
        const reviewSnap = await transaction.get(reviewRef);
        if (!reviewSnap.exists) throw new HttpError(404, 'Review not found.');
        const reviewsSnap = await transaction.get(reviewsQuery);

        const aggregates = aggregate(reviewsSnap, reviewRef.id, null);
        const now = FieldValue.serverTimestamp();

        // ---- writes ----
        transaction.delete(reviewRef);
        transaction.update(productRef, { ...aggregates, updatedAt: now });

        return { deleted: true, ...aggregates };
      });
      return res.status(200).json({ success: true, ...result });
    }

    const { rating, comment } = parseBody(body);

    const result = await db.runTransaction(async (transaction) => {
      // ---- reads first --------------------------------------------------
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw new HttpError(404, 'Product not found.');
      const product = productSnap.data() || {};
      if (product.active === false) {
        throw new HttpError(409, 'This product is no longer available.');
      }

      const existingSnap = await transaction.get(reviewRef);

      // Verified purchase = a non-cancelled order containing this product.
      const ordersSnap = await transaction.get(
        db.collection('orders').where('customerId', '==', token.uid)
      );
      const verifiedPurchase = ordersSnap.docs.some((doc) => {
        const order = doc.data() || {};
        if (order.status === 'cancelled') return false;
        return (order.items || []).some((item) => item.productId === productId);
      });

      const reviewsSnap = await transaction.get(reviewsQuery);
      const aggregates = aggregate(reviewsSnap, reviewRef.id, rating);

      // ---- writes -------------------------------------------------------
      const now = FieldValue.serverTimestamp();
      const review = {
        productId,
        userId: token.uid,
        userName: String(token.name || '').slice(0, 120) || 'Customer',
        rating,
        comment,
        verifiedPurchase,
        updatedAt: now,
        ...(existingSnap.exists ? {} : { createdAt: now }),
      };

      transaction.set(reviewRef, review, { merge: true });
      transaction.update(productRef, { ...aggregates, updatedAt: now });

      return {
        reviewId: reviewRef.id,
        created: !existingSnap.exists,
        verifiedPurchase,
        ...aggregates,
      };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error('[reviews] failed:', err?.message);
    return res.status(status).json({
      error: status >= 500 ? 'Could not save your review. Please try again.' : err.message,
    });
  }
};
