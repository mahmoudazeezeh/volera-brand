import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.fn();

vi.mock('./insforgeSession', () => ({
  ensureValidInsforgeAccessToken: vi.fn().mockResolvedValue(undefined),
  isLikelyInvalidTokenMessage: vi.fn().mockReturnValue(false),
}));

vi.mock('./insforgeClient', () => ({
  insforge: {
    database: { from: (...args: unknown[]) => mockFrom(...args) },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { key: 'k', url: 'https://x' }, error: null }),
        remove: vi.fn().mockResolvedValue({}),
      }),
    },
    getHttpClient: () => ({
      setAuthToken: vi.fn(),
      setRefreshToken: vi.fn(),
      get: vi.fn(),
    }),
  },
}));

import { adminInsertProduct, adminUpdateProduct } from './voleraAdminApi';

describe('voleraAdminApi (mocked InsForge)', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('adminInsertProduct: inserts dummy product and returns id', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: () => ({
            select: () =>
              Promise.resolve({
                data: [{ id: 1001 }],
                error: null,
              }),
          }),
        };
      }
      return {};
    });

    const r = await adminInsertProduct({
      name: 'Test Product EN',
      name_ar: 'منتج تجريبي',
      price: 99,
      category: 'عطور نسائية',
      description: 'dummy desc',
      description_ar: 'وصف تجريبي',
      discount: 5,
      stock_quantity: 10,
      image: 'https://example.com/p.png',
      images: ['https://example.com/p.png'],
    });

    expect(r).toEqual({ ok: true, id: 1001 });
    expect(mockFrom).toHaveBeenCalledWith('products');
  });

  it('adminUpdateProduct: updates dummy product without error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    const r = await adminUpdateProduct(1001, {
      name_ar: 'منتج معدّل',
      price: 120,
    });

    expect(r).toEqual({ ok: true });
    expect(mockFrom).toHaveBeenCalledWith('products');
  });
});
