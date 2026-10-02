import axios from 'axios';
import { apiService, resolveApiUrl, DEFAULT_API_URL } from '../src/services/api';

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

const client = (axios.create as jest.Mock).mock.results[0].value;

describe('resolveApiUrl', () => {
  it('defaults to the production backend when nothing is configured', () => {
    expect(DEFAULT_API_URL).toBe('https://siphappens.onrender.com/');
    expect(resolveApiUrl(undefined, undefined)).toBe(DEFAULT_API_URL);
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: DEFAULT_API_URL }));
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
