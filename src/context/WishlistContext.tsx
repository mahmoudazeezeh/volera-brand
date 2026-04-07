import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { fetchWishlistIds, toggleWishlist } from '../lib/wishlistApi';

type WishlistContextValue = {
  ids: Set<number>;
  ready: boolean;
  refresh: () => Promise<void>;
  isSaved: (productId: number) => boolean;
  toggle: (productId: number) => Promise<{ ok: boolean; error?: string }>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setIds(new Set());
      setReady(true);
      return;
    }
    const { data, error } = await fetchWishlistIds(user.id);
    if (error) {
      setIds(new Set());
    } else {
      setIds(new Set(data));
    }
    setReady(true);
  }, [user?.id]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  const isSaved = useCallback((productId: number) => ids.has(productId), [ids]);

  const toggle = useCallback(async (productId: number) => {
    if (!user?.id) return { ok: false, error: 'login' };
    const was = idsRef.current.has(productId);
    const r = await toggleWishlist(user.id, productId, was);
    if (!r.ok) return { ok: false, error: r.error };
    setIds((prev) => {
      const next = new Set(prev);
      if (was) next.delete(productId);
      else next.add(productId);
      return next;
    });
    return { ok: true };
  }, [user?.id]);

  const value = useMemo(
    () => ({ ids, ready, refresh, isSaved, toggle }),
    [ids, ready, refresh, isSaved, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
