import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSchema } from '@insforge/sdk';

const mocks = vi.hoisted(() => ({
  saveSession: vi.fn(),
  setAccessToken: vi.fn(),
  getSession: vi.fn(),
  getAccessToken: vi.fn(),
  getUser: vi.fn(),
  setAuthToken: vi.fn(),
  userToken: null as string | null,
}));

vi.mock('./insforgeClient', () => ({
  insforge: {
    tokenManager: {
      saveSession: mocks.saveSession,
      setAccessToken: mocks.setAccessToken,
      getSession: mocks.getSession,
      getAccessToken: mocks.getAccessToken,
      getUser: mocks.getUser,
    },
    getHttpClient: () => ({
      setAuthToken: mocks.setAuthToken,
      setRefreshToken: vi.fn(),
      get: vi.fn(),
      get userToken() {
        return mocks.userToken;
      },
    }),
  },
}));

import {
  isLikelyInvalidTokenMessage,
  reconcileInsforgeDatabaseAuth,
  syncInsforgeAccessTokenForDatabase,
} from './insforgeSession';

describe('isLikelyInvalidTokenMessage', () => {
  it('matches common auth failure strings', () => {
    expect(isLikelyInvalidTokenMessage('Invalid token')).toBe(true);
    expect(isLikelyInvalidTokenMessage('invalid_token')).toBe(true);
    expect(isLikelyInvalidTokenMessage('JWT expired')).toBe(true);
    expect(isLikelyInvalidTokenMessage('Unauthorized')).toBe(true);
    expect(isLikelyInvalidTokenMessage('row-level security')).toBe(false);
  });
});

describe('reconcileInsforgeDatabaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userToken = null;
    mocks.getAccessToken.mockReturnValue(null);
    mocks.getSession.mockReturnValue(null);
    mocks.getUser.mockReturnValue(null);
  });

  it('syncs tokenManager from HttpClient when both differ', () => {
    mocks.getAccessToken.mockReturnValue('old');
    mocks.userToken = 'new';
    mocks.getUser.mockReturnValue({ id: 'u1', email: 'a@b.com' } as UserSchema);

    reconcileInsforgeDatabaseAuth();

    expect(mocks.setAuthToken).toHaveBeenCalledWith('new');
    expect(mocks.saveSession).toHaveBeenCalledWith({
      accessToken: 'new',
      user: { id: 'u1', email: 'a@b.com' },
    });
  });

  it('does nothing when tokens already match', () => {
    mocks.getAccessToken.mockReturnValue('same');
    mocks.userToken = 'same';

    reconcileInsforgeDatabaseAuth();

    expect(mocks.setAuthToken).not.toHaveBeenCalled();
  });
});

describe('syncInsforgeAccessTokenForDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockReturnValue(null);
    mocks.getAccessToken.mockReturnValue(null);
    mocks.getSession.mockReturnValue(null);
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
