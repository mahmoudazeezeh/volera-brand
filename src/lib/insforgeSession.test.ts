import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSchema } from '@insforge/sdk';

const mocks = vi.hoisted(() => ({
  saveSession: vi.fn(),
  setAccessToken: vi.fn(),
  getUser: vi.fn(),
  setAuthToken: vi.fn(),
}));

vi.mock('./insforgeClient', () => ({
  insforge: {
    tokenManager: {
      saveSession: mocks.saveSession,
      setAccessToken: mocks.setAccessToken,
      getUser: mocks.getUser,
    },
    getHttpClient: () => ({
      setAuthToken: mocks.setAuthToken,
      setRefreshToken: vi.fn(),
      get: vi.fn(),
    }),
  },
}));

import { isLikelyInvalidTokenMessage, syncInsforgeAccessTokenForDatabase } from './insforgeSession';

describe('isLikelyInvalidTokenMessage', () => {
  it('matches common auth failure strings', () => {
    expect(isLikelyInvalidTokenMessage('Invalid token')).toBe(true);
    expect(isLikelyInvalidTokenMessage('invalid_token')).toBe(true);
    expect(isLikelyInvalidTokenMessage('JWT expired')).toBe(true);
    expect(isLikelyInvalidTokenMessage('Unauthorized')).toBe(true);
    expect(isLikelyInvalidTokenMessage('row-level security')).toBe(false);
  });
});

describe('syncInsforgeAccessTokenForDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockReturnValue(null);
  });

  it('uses saveSession when user hint is provided', () => {
    const user = { id: 'u1', email: 'a@b.com' } as UserSchema;
    syncInsforgeAccessTokenForDatabase('access-1', user);
    expect(mocks.setAuthToken).toHaveBeenCalledWith('access-1');
    expect(mocks.saveSession).toHaveBeenCalledWith({ accessToken: 'access-1', user });
    expect(mocks.setAccessToken).not.toHaveBeenCalled();
  });

  it('uses setAccessToken when no user in hint or tokenManager', () => {
    mocks.getUser.mockReturnValue(null);
    syncInsforgeAccessTokenForDatabase('access-2', null);
    expect(mocks.setAuthToken).toHaveBeenCalledWith('access-2');
    expect(mocks.saveSession).not.toHaveBeenCalled();
    expect(mocks.setAccessToken).toHaveBeenCalledWith('access-2');
  });

  it('uses tokenManager user when hint omitted', () => {
    const user = { id: 'u2', email: 'c@d.com' } as UserSchema;
    mocks.getUser.mockReturnValue(user);
    syncInsforgeAccessTokenForDatabase('access-3');
    expect(mocks.saveSession).toHaveBeenCalledWith({ accessToken: 'access-3', user });
  });
});
