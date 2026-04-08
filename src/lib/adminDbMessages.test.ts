import { describe, expect, it } from 'vitest';
import { enhanceAdminDbErrorMessage } from './adminDbMessages';

describe('enhanceAdminDbErrorMessage', () => {
  it('passes through unrelated messages', () => {
    expect(enhanceAdminDbErrorMessage('Network error')).toBe('Network error');
  });

  it('appends RLS guidance', () => {
    const raw = 'new row violates row-level security policy for table "products"';
    const out = enhanceAdminDbErrorMessage(raw)!;
    expect(out).toContain(raw);
    expect(out).toContain('rls_products_admin.sql');
  });
});
