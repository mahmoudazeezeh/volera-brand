import { beforeEach, describe, expect, it, vi } from 'vitest';

/* ─── Mock مُشترك ─── */
const mockFrom = vi.fn();
const mockRemove = vi.fn();

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
        remove: mockRemove,
      }),
    },
    getHttpClient: () => ({
      setAuthToken: vi.fn(),
      setRefreshToken: vi.fn(),
      get: vi.fn(),
    }),
  },
}));

import {
  adminInsertProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminRollbackInsertedProduct,
} from './voleraAdminApi';

/* ─────────────────────────────────────── */
/*  adminInsertProduct                     */
/* ─────────────────────────────────────── */
describe('adminInsertProduct', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('✅ ينجح الإدراج ويعيد id', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: () => ({
            select: () =>
              Promise.resolve({ data: [{ id: 1001 }], error: null }),
          }),
        };
      }
      return {};
    });

    const r = await adminInsertProduct({
      name: 'Test EN',
      name_ar: 'منتج تجريبي',
      price: 99,
      category: 'عطور نسائية',
      description: 'desc',
      description_ar: 'وصف',
      discount: 5,
      stock_quantity: 10,
      image: 'https://example.com/p.png',
      images: ['https://example.com/p.png'],
    });

    expect(r).toEqual({ ok: true, id: 1001 });
    expect(mockFrom).toHaveBeenCalledWith('products');
  });

  it('❌ يُعيد خطأ عند فشل الإدراج في قاعدة البيانات', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: () => ({
            select: () =>
              Promise.resolve({ data: null, error: new Error('db insert failed') }),
          }),
        };
      }
      return {};
    });

    const r = await adminInsertProduct({
      name: 'X',
      name_ar: 'س',
      price: 10,
      category: 'عطور رجالية',
      description: 'd',
      description_ar: 'و',
      stock_quantity: 1,
      image: 'https://x.com/img.png',
    });

    expect(r).toEqual({ ok: false, error: 'db insert failed' });
  });

  it('❌ يُعيد خطأ عند عدم وجود id في الاستجابة', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: () => ({
            select: () =>
              Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      return {};
    });

    const r = await adminInsertProduct({
      name: 'X',
      name_ar: 'س',
      price: 10,
      category: 'عطور رجالية',
      description: 'd',
      description_ar: 'و',
      stock_quantity: 1,
      image: 'https://x.com/img.png',
    });

    expect(r).toEqual({ ok: false, error: 'لم يُرجَد المنتج' });
  });
});

/* ─────────────────────────────────────── */
/*  adminUpdateProduct                     */
/* ─────────────────────────────────────── */
describe('adminUpdateProduct', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('✅ ينجح تعديل المنتج', async () => {
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

  it('❌ يُعيد خطأ عند فشل التعديل', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          update: () => ({
            eq: () => Promise.resolve({ error: new Error('update failed') }),
          }),
        };
      }
      return {};
    });

    const r = await adminUpdateProduct(1001, { price: 50 });

    expect(r).toEqual({ ok: false, error: 'update failed' });
  });

  it('✅ يضيف images تلقائياً عند تحديث الصورة الرئيسية فقط', async () => {
    let capturedPatch: Record<string, unknown> = {};

    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          update: (patch: Record<string, unknown>) => {
            capturedPatch = patch;
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      return {};
    });

    await adminUpdateProduct(42, { image: 'https://new-image.com/x.jpg' });

    expect(capturedPatch.images).toEqual(['https://new-image.com/x.jpg']);
  });

  it('✅ لا يستبدل images الموجودة عند تمريرها صراحةً', async () => {
    let capturedPatch: Record<string, unknown> = {};

    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          update: (patch: Record<string, unknown>) => {
            capturedPatch = patch;
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      return {};
    });

    const imgs = ['https://a.com/1.jpg', 'https://b.com/2.jpg'];
    await adminUpdateProduct(42, { image: 'https://a.com/1.jpg', images: imgs });

    expect(capturedPatch.images).toEqual(imgs);
  });
});

/* ─────────────────────────────────────── */
/*  adminDeleteProduct                     */
/* ─────────────────────────────────────── */
describe('adminDeleteProduct', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRemove.mockReset();
    mockRemove.mockResolvedValue({ data: null, error: null });
  });

  it('✅ يحذف المنتج وصوره بنجاح', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_images') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({ data: [{ storage_key: 'p1/abc.jpg' }], error: null }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'products') {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    const r = await adminDeleteProduct(1);

    expect(r).toEqual({ ok: true });
    // تحقق أن remove استُدعي بمصفوفة وليس بقيمة فردية
    expect(mockRemove).toHaveBeenCalledWith(['p1/abc.jpg']);
  });

  it('✅ يحذف المنتج حتى لو لم تكن له صور في Storage', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_images') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'products') {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    const r = await adminDeleteProduct(2);

    expect(r).toEqual({ ok: true });
    // لم تكن هناك صور فلا داعي لاستدعاء remove
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('❌ يُعيد خطأ عند فشل حذف المنتج من قاعدة البيانات', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_images') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'products') {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: new Error('permission denied') }),
          }),
        };
      }
      return {};
    });

    const r = await adminDeleteProduct(3);

    expect(r).toEqual({ ok: false, error: 'permission denied' });
  });

  it('✅ يحذف مصفوفة متعددة من مفاتيح الصور دفعةً واحدة', async () => {
    const keys = ['p5/img1.jpg', 'p5/img2.jpg', 'p5/img3.png'];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_images') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: keys.map((k) => ({ storage_key: k })),
                error: null,
              }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'products') {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    const r = await adminDeleteProduct(5);

    expect(r).toEqual({ ok: true });
    // يجب أن يُستدعى مرة واحدة فقط بالمصفوفة كاملة
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith(keys);
  });
});

/* ─────────────────────────────────────── */
/*  adminRollbackInsertedProduct           */
/* ─────────────────────────────────────── */
describe('adminRollbackInsertedProduct', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('✅ يحذف المنتج الذي أُنشئ للتو دون إلقاء خطأ', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    await expect(adminRollbackInsertedProduct(999)).resolves.toBeUndefined();
  });

  it('✅ يتجاهل الأخطاء بصمت (best-effort cleanup)', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('network error');
    });

    await expect(adminRollbackInsertedProduct(999)).resolves.toBeUndefined();
  });
});
