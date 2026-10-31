import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { addToWishlist, getWishlist, removeFromWishlist } from '../config/firestore';

const WishlistContext = createContext(null);

/**
 * One source of truth for saved products.
 *
 * Previously every card kept a local `wished` flag and ProductDetailPage kept
 * its own copy, so hearts disagreed across pages and nothing was ever written
 * to Firestore. This provider loads the signed-in user's wishlist once, shares
 * it with every surface, and updates optimistically with a rollback on failure.
 */
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const [ids, setIds] = useState([]);
  const [busyIds, setBusyIds] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));
  // Bumped on every local mutation so an in-flight initial fetch cannot
  // overwrite a newer optimistic update (common right after signing in).
  const versionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setIds([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const version = versionRef.current;
    getWishlist(uid)
      .then((list) => {
        if (!cancelled && versionRef.current === version) {
          setIds(Array.from(new Set((list || []).filter(Boolean))));
        }
      })
      .catch((err) => {
        console.error('Failed to load wishlist:', err);
        if (!cancelled && versionRef.current === version) setIds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const isWished = useCallback((productId) => ids.includes(productId), [ids]);

  const toggleWishlist = useCallback(
    async (productId, overrideUid) => {
      const targetUid = overrideUid || uid;
      if (!targetUid || !productId) return { ok: false };

      const wasSaved = ids.includes(productId);
      versionRef.current += 1;

      // Optimistic: the heart responds instantly.
      setIds((prev) =>
        wasSaved ? prev.filter((id) => id !== productId) : [...prev, productId],
      );
      setBusyIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

      try {
        if (wasSaved) await removeFromWishlist(targetUid, productId);
        else await addToWishlist(targetUid, productId);
        // Reconcile in case the initial fetch landed mid-write.
        setIds((prev) => {
          if (wasSaved) return prev.filter((id) => id !== productId);
          return prev.includes(productId) ? prev : [...prev, productId];
        });
        return { ok: true, added: !wasSaved };
      } catch (err) {
        // Roll back so the UI never lies about what is stored server-side.
        setIds((prev) => {
          if (wasSaved) return prev.includes(productId) ? prev : [...prev, productId];
          return prev.filter((id) => id !== productId);
        });
        console.error('Failed to update wishlist:', err);
        return { ok: false, error: err };
      } finally {
        setBusyIds((prev) => prev.filter((id) => id !== productId));
      }
    },
    [ids, uid],
  );

  const value = useMemo(
    () => ({
      wishlistIds: ids,
      isWished,
      toggleWishlist,
      busyIds,
      loading,
      count: ids.length,
    }),
    [ids, isWished, toggleWishlist, busyIds, loading],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};

export default WishlistContext;
