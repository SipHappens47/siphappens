import axios from 'axios';
import { apiService } from '../src/services/api';

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
