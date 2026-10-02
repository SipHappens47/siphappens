import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { apiService, resolveApiUrl, DEFAULT_API_URL, SESSION_EXPIRED_MESSAGE } from '../src/services/api';

// ApiService builds its own axios instance, so mock axios.create with a fake
// client that records the interceptors it registers.
jest.mock('axios', () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return { __esModule: true, default: { create: jest.fn(() => client) } };
});

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn() }));

const client = (axios.create as jest.Mock).mock.results[0].value;
const onResponseError = client.interceptors.response.use.mock.calls[0][1];

describe('session expiry (401) handling', () => {
  const handler = jest.fn();
  const rejected = (status: number | undefined, url: string, authorization?: string) => ({
    config: { url: new URL(url, DEFAULT_API_URL).toString(), headers: authorization ? { Authorization: authorization } : {} },
    response: status ? { status, data: { statusCode: status, message: 'Unauthorized' } } : undefined,
    message: status ? `Request failed with status code ${status}` : 'timeout of 90000ms exceeded',
  });

  beforeEach(() => {
    handler.mockReset();
    apiService.setSessionExpiredHandler(handler);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('current-token');
  });
  afterAll(() => apiService.setSessionExpiredHandler(null));

  it('signs out once when the current token is rejected mid-session, and still rejects the call', async () => {
    const error = rejected(401, '/api/bar', 'Bearer current-token');
    await expect(onResponseError(error)).rejects.toBe(error);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(error.response?.data.message).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('leaves wrong-password and reset-code 401s to the login, signup and reset screens', async () => {
    for (const path of ['/api/auth/login', '/api/signup', '/api/auth/forgot-password', '/api/auth/reset-password']) {
      const error = rejected(401, path, 'Bearer current-token');
      await expect(onResponseError(error)).rejects.toBe(error);
      expect(error.response?.data.message).toBe('Unauthorized');
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores a 401 for a token that was already replaced or cleared, or a request sent without one', async () => {
    await expect(onResponseError(rejected(401, '/api/bar', 'Bearer old-token'))).rejects.toBeDefined();
    await expect(onResponseError(rejected(401, '/api/bar'))).rejects.toBeDefined();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await expect(onResponseError(rejected(401, '/api/bar', 'Bearer current-token'))).rejects.toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });

  it('never signs out on timeouts, server errors or forbidden responses', async () => {
    await expect(onResponseError(rejected(undefined, '/api/bar', 'Bearer current-token'))).rejects.toBeDefined();
    await expect(onResponseError(rejected(500, '/api/bar', 'Bearer current-token'))).rejects.toBeDefined();
    await expect(onResponseError(rejected(403, '/api/bar', 'Bearer current-token'))).rejects.toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('resolveApiUrl', () => {
  it('defaults to the production backend when nothing is configured', () => {
    expect(DEFAULT_API_URL).toBe('https://siphappens.onrender.com/');
    expect(resolveApiUrl(undefined, undefined)).toBe(DEFAULT_API_URL);
  });

  it('builds the client from the resolved URL, whatever EXPO_PUBLIC_API_URL the shell has', () => {
    // Same inputs api.ts used at import, so the check holds with the variable set or unset (NF-9a).
    const expected = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants?.expoConfig?.extra?.apiUrl);
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: expected }));
  });

  it('prefers a build-profile env URL, then app.json extra.apiUrl', () => {
    expect(resolveApiUrl(' https://staging.example.test/ ', 'https://extra.example.test/')).toBe('https://staging.example.test/');
    expect(resolveApiUrl(undefined, 'https://extra.example.test/')).toBe('https://extra.example.test/');
  });

  it('ignores blank or malformed values', () => {
    expect(resolveApiUrl('', 'not a url')).toBe(DEFAULT_API_URL);
    expect(resolveApiUrl('ftp://x', 42)).toBe(DEFAULT_API_URL);
  });
});

describe('apiService', () => {
  beforeEach(() => {
    client.get.mockReset();
    client.post.mockReset();
  });

  describe('getPours', () => {
    it('should fetch pours successfully', async () => {
      const mockPours = [
        {
          id: '1',
          spiritId: 'spirit1',
          whyItHit: 'Great taste',
          isShared: false,
        },
      ];

      client.get.mockResolvedValue({ data: mockPours });

      const result = await apiService.getPours();

      expect(result).toEqual(mockPours);
    });

    it('should reject on error', async () => {
      client.get.mockRejectedValue(new Error('Network error'));

      await expect(apiService.getPours()).rejects.toThrow('Network error');
    });
  });

  describe('createPour', () => {
    it('should create pour successfully', async () => {
      const newPour = {
        spiritId: 'spirit1',
        whyItHit: 'Amazing flavor',
        isShared: false,
      };

      const mockResponse = {
        id: 'pour1',
        ...newPour,
      };

      client.post.mockResolvedValue({ data: mockResponse });

      const result = await apiService.createPour(newPour);

      expect(result?.id).toBe('pour1');
      expect(result?.whyItHit).toBe('Amazing flavor');
    });
  });
});
