import { apiService } from '../src/services/api';
import axios from 'axios';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockPours });

      const result = await apiService.getPours();

      expect(result).toEqual(mockPours);
    });

    it('should return empty array on error', async () => {
      mockedAxios.get = jest.fn().mockRejectedValue(new Error('Network error'));

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

      mockedAxios.post = jest.fn().mockResolvedValue({ data: mockResponse });

      const result = await apiService.createPour(newPour);

      expect(result?.id).toBe('pour1');
      expect(result?.whyItHit).toBe('Amazing flavor');
    });
  });
});
