import { apiService } from './api';

interface UnverifiedDistillery {
  id: string;
  name: string;
  region?: string;
  country?: string;
  logo?: string;
  bio?: string;
  spirittypes?: string;
  createdat: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export const adminService = {
  async getUnverifiedDistilleries(): Promise<UnverifiedDistillery[]> {
    try {
      const response = await apiService.get('/api/admin/distilleries/unverified');
      return response?.data ?? [];
    } catch (error) {
      console.error('Get unverified distilleries error:', error);
      throw error;
    }
  },

  async verifyDistillery(distilleryId: string): Promise<void> {
    try {
      await apiService.post(`/api/admin/distilleries/${distilleryId}/verify`, {});
    } catch (error) {
      console.error('Verify distillery error:', error);
      throw error;
    }
  },

  async rejectDistillery(distilleryId: string): Promise<void> {
    try {
      await apiService.post(`/api/admin/distilleries/${distilleryId}/reject`, {});
    } catch (error) {
      console.error('Reject distillery error:', error);
      throw error;
    }
  },
};
