import React from 'react';
import { isPublicRoute } from '../src/utils/authRoutes';
import { getApiErrorMessage } from '../src/utils/errors';

describe('isPublicRoute', () => {
  it('allows the entry index and empty segments', () => {
    expect(isPublicRoute([])).toBe(true);
    expect(isPublicRoute(['index'])).toBe(true);
  });

  it('allows auth and legal stacks', () => {
    expect(isPublicRoute(['auth', 'login'])).toBe(true);
    expect(isPublicRoute(['auth', 'welcome'])).toBe(true);
    expect(isPublicRoute(['legal', 'terms'])).toBe(true);
    expect(isPublicRoute(['legal', 'privacy'])).toBe(true);
  });

  it('allows the unmatched route screen', () => {
    expect(isPublicRoute(['+not-found'])).toBe(true);
  });

  it('blocks the protected app shell', () => {
    expect(isPublicRoute(['tabs'])).toBe(false);
    expect(isPublicRoute(['tabs', 'scan'])).toBe(false);
    expect(isPublicRoute(['camera'])).toBe(false);
    expect(isPublicRoute(['profile'])).toBe(false);
    expect(isPublicRoute(['pour', 'create'])).toBe(false);
    expect(isPublicRoute(['distilleries', 'abc'])).toBe(false);
    expect(isPublicRoute(['admin', 'verification'])).toBe(false);
    expect(isPublicRoute(['onboarding'])).toBe(false);
  });
});

describe('getApiErrorMessage', () => {
  it('prefers Nest message strings', () => {
    expect(
      getApiErrorMessage(
        { response: { status: 401, data: { message: 'Invalid credentials' } } },
        'fallback',
      ),
    ).toBe('Invalid credentials');
  });

  it('joins validation arrays', () => {
    expect(
      getApiErrorMessage(
        { response: { status: 400, data: { message: ['email must be an email'] } } },
        'fallback',
      ),
    ).toBe('email must be an email');
  });

  it('uses fallback for 401 without a body message', () => {
    expect(
      getApiErrorMessage(
        { response: { status: 401 }, message: 'Request failed with status code 401' },
        'Invalid email or password. Please try again.',
      ),
    ).toBe('Invalid email or password. Please try again.');
  });
});
