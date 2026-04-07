import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '../types/Product';
import type { CartLine } from '../types/Cart';

const STORAGE_KEY = 'volera_cart_v1';

type CartContextValue = {
  lines: CartLine[];
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeLine: (productId: number, size: string) => void;
  setQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartLine =>
        x &&
        typeof x === 'object' &&
        typeof (x as CartLine).productId === 'number' &&
        typeof (x as CartLine).nameAr === 'string' &&
        typeof (x as CartLine).image === 'string' &&
        typeof (x as CartLine).price === 'number' &&
        typeof (x as CartLine).size === 'string' &&
        typeof (x as CartLine).quantity === 'number'
    );
  } catch {
    return [];
  }
}

function saveLines(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadLines);

  useEffect(() => {
    saveLines(lines);
  }, [lines]);

  const addItem = useCallback((product: Product, size: string, quantity = 1) => {
    const qty = Math.max(1, Math.floor(quantity));
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === product.id && l.size === size);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + qty, price: product.finalPrice };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          nameAr: product.nameAr,
          image: product.image,
          price: product.finalPrice,
          size,
          quantity: qty,
        },
      ];
    });
  }, []);

  const removeLine = useCallback((productId: number, size: string) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)));
  }, []);

  const setQuantity = useCallback((productId: number, size: string, quantity: number) => {
    const q = Math.floor(quantity);
    if (q < 1) {
      setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)));
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId && l.size === size ? { ...l, quantity: q } : l
      )
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totalItems = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.price * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      addItem,
      removeLine,
      setQuantity,
      clearCart,
      totalItems,
      subtotal,
    }),
    [lines, addItem, removeLine, setQuantity, clearCart, totalItems, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
