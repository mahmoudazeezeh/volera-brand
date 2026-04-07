import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchProducts } from '../lib/productApi';
import type { Product } from '../types/Product';

type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  loadError: string | null;
  refetch: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchProducts();
    if (error) {
      setLoadError(error.message);
      setProducts([]);
    } else {
      setLoadError(null);
      setProducts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);

  const value = useMemo(
    () => ({
      products,
      loading,
      loadError,
      refetch,
    }),
    [products, loading, loadError, refetch]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return ctx;
}
