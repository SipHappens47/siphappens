import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AuthResponse, User, Spirit, Pour, FlavorTag, Distillery, SpiritRecognitionResponse, FileUploadResponse, FileUrlResponse, Connection, FellowSipper, BarPour, RadarEntry, UniversalSearchResults, Badge, TasteSummary } from '../types';
import { DistilleryProfile, DistilleryDiscoverData, DistilleryPour, DistillerySpirit, DistilleryAnalytics } from '../types/distillery';
import { warmingStart, warmingEnd } from '../components/WarmingOverlay';

// Cloud backend (NestJS on Render). Reachable from any device, no PC required.
// For local development against the PC, swap to 'http://10.0.0.3:3000/'.
const API_URL = 'https://siphappens.onrender.com/';

console.log('='.repeat(60));
console.log('[ApiService] USING HARDCODED PRODUCTION API URL');
console.log('[ApiService] API_URL:', API_URL);
console.log('='.repeat(60));

class ApiService {
  private client: AxiosInstance;
  // Monotonic id for pairing each request with its warming-overlay start/end.
  private static warmingSeq = 0;

  constructor() {
    console.log('[ApiService] Initializing with API_URL:', API_URL);
    
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Render free tier cold starts can take ~60s; keep requests alive
      // long enough for the server to wake instead of failing at 30s.
      timeout: 90000,
    });

    this.client.interceptors.request.use(
      async (config) => {
        console.log('[ApiService] Request:', config.method?.toUpperCase(), config.url);
        // If this request takes >3s the server is likely cold-starting:
        // show the global warming overlay until it responds. Each request gets
        // a unique id so the overlay state can't drift, plus a safety timeout
        // that force-ends it after 75s in case the response is never seen
        // (e.g. a network error with no config to clear) — so the overlay can
        // never outlive the request that triggered it.
        const warmingId = ++ApiService.warmingSeq;
        (config as any).__warmingId = warmingId;
        (config as any).__warmingTimer = setTimeout(() => {
          (config as any).__warmingShown = true;
          warmingStart(warmingId);
        }, 3000);
        (config as any).__warmingSafety = setTimeout(() => {
          warmingEnd(warmingId);
        }, 75000);
        try {
          const token = Platform.OS === 'web'
            ? await AsyncStorage.getItem('authToken')
            : await SecureStore.getItemAsync('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[ApiService] Added auth token to request');
          }
        } catch (error) {
          console.error('[ApiService] Failed to get auth token:', error);
        }
        return config;
      },
      (error) => {
        console.error('[ApiService] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    const clearWarming = (config: any) => {
      if (!config) return;
      if (config.__warmingTimer) clearTimeout(config.__warmingTimer);
      if (config.__warmingSafety) clearTimeout(config.__warmingSafety);
      // warmingEnd is idempotent, so calling it even when the overlay was
      // never shown (request finished under 3s) is harmless.
      if (config.__warmingId != null) warmingEnd(config.__warmingId);
    };

    this.client.interceptors.response.use(
      (response) => {
        console.log('[ApiService] Response:', response.status, response.config.url);
        clearWarming(response.config);
        return response;
      },
      async (error: AxiosError) => {
        clearWarming(error?.config);
        console.error('[ApiService] Response error:', {
          status: error?.response?.status,
          url: error?.config?.url,
          message: error?.message,
          data: error?.response?.data
        });
        
        if (error?.response?.status === 401) {
          try {
            if (Platform.OS === 'web') {
              await AsyncStorage.removeItem('authToken');
            } else {
              await SecureStore.deleteItemAsync('authToken');
            }
          } catch (e) {
            console.error('[ApiService] Failed to remove token:', e);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async signup(data: { email: string; password: string; name: string; ageVerified: boolean; ageVerificationTimestamp: string }): Promise<AuthResponse> {
    const url = new URL('/api/signup', API_URL).toString();
    console.log('[ApiService] Signup URL:', url);
    console.log('[ApiService] API_URL:', API_URL);
    console.log('[ApiService] Signup data:', { email: data.email, name: data.name });
    const response = await this.client.post<AuthResponse>(url, data);
    console.log('[ApiService] Signup response status:', response?.status);
    return response?.data ?? { token: '', user: {} as User };
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const url = new URL('/api/auth/login', API_URL).toString();
      console.log('[ApiService] Login FULL URL:', url);
      console.log('[ApiService] Login BASE URL:', API_URL);
      console.log('[ApiService] Login email:', data.email);
      
      const response = await this.client.post<AuthResponse>(url, data);
      
      console.log('[ApiService] Login SUCCESS - status:', response?.status);
      return response?.data ?? { token: '', user: {} as User };
    } catch (error: any) {
      console.error('[ApiService] Login FAILED');
      console.error('[ApiService] Error message:', error?.message);
      console.error('[ApiService] Error response:', error?.response?.data);
      console.error('[ApiService] Error status:', error?.response?.status);
      throw error;
    }
  }

  async getMe(): Promise<User> {
    const url = new URL('/api/auth/me', API_URL).toString();
    console.log('[ApiService] getMe - calling:', url);
    const response = await this.client.get<User>(url);
    console.log('[ApiService] getMe - response status:', response?.status);
    return response?.data ?? {} as User;
  }

  // Profile
  async getProfile(): Promise<User> {
    const response = await this.client.get<User>(new URL('/api/profile', API_URL).toString());
    return response?.data ?? {} as User;
  }

  async updateProfile(data: { name?: string; profilePhoto?: string; heroImage?: string; bio?: string; experienceLevel?: string }): Promise<User> {
    const response = await this.client.put<User>(new URL('/api/profile', API_URL).toString(), data);
    return response?.data ?? {} as User;
  }

  async getPublicProfile(userId: string): Promise<User> {
    const response = await this.client.get<User>(new URL(`/api/profile/user/${userId}`, API_URL).toString());
    return response?.data ?? {} as User;
  }

  async getPublicUserBadges(userId: string): Promise<Badge[]> {
    const response = await this.client.get<Badge[]>(new URL(`/api/badges/user/${userId}`, API_URL).toString());
    return response?.data ?? [];
  }

  async getPublicUserTasteSummary(userId: string): Promise<TasteSummary> {
    const response = await this.client.get<TasteSummary>(new URL(`/api/badges/user/${userId}/taste-summary`, API_URL).toString());
    return response?.data ?? {} as TasteSummary;
  }

  async getUserPublicPours(userId: string): Promise<Pour[]> {
    const response = await this.client.get<Pour[]>(new URL(`/api/pours/user/${userId}/public`, API_URL).toString());
    return response?.data ?? [];
  }

  // Spirits
  async recognizeSpirit(image: string): Promise<SpiritRecognitionResponse> {
    const response = await this.client.post<SpiritRecognitionResponse>(
      new URL('/api/spirits/recognize', API_URL).toString(),
      { image }
    );
    return response?.data ?? { matches: [] };
  }

  async createSpirit(data: {
    name: string;
    distilleryId?: string;
    category?: string;
    style?: string;
    abv?: number;
    region?: string;
    bottleImage?: string;
    flavorTagIds?: string[];
  }): Promise<Spirit> {
    const response = await this.client.post<Spirit>(new URL('/api/spirits', API_URL).toString(), data);
    return response?.data ?? {} as Spirit;
  }

  async getSpirit(id: string): Promise<Spirit> {
    const response = await this.client.get<Spirit>(new URL(`/api/spirits/${id}`, API_URL).toString());
    return response?.data ?? {} as Spirit;
  }

  async searchSpirits(query: string): Promise<Spirit[]> {
    const response = await this.client.get<Spirit[]>(new URL(`/api/spirits/search?q=${encodeURIComponent(query)}`, API_URL).toString());
    return response?.data ?? [];
  }

  async createDistillery(data: { name: string; country?: string; region?: string }): Promise<Distillery> {
    const response = await this.client.post<Distillery>(new URL('/api/distilleries', API_URL).toString(), data);
    return response?.data ?? {} as Distillery;
  }

  async searchDistilleries(query: string): Promise<Distillery[]> {
    const response = await this.client.get<Distillery[]>(new URL(`/api/distilleries/search?q=${encodeURIComponent(query)}`, API_URL).toString());
    return response?.data ?? [];
  }

  // Pours
  async createPour(data: {
    spiritId: string;
    whyItHit: string;
    isShared: boolean;
    image?: string;
    flavorTagIds?: string[];
    rating?: number;
    wouldPourAgain?: string;
    occasions?: string;
  }): Promise<Pour> {
    const response = await this.client.post<Pour>(new URL('/api/pours', API_URL).toString(), data);
    return response?.data ?? {} as Pour;
  }

  async getPours(filters?: {
    category?: string;
    flavorTags?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<Pour[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.flavorTags) params.append('flavorTags', filters.flavorTags);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);

    const url = new URL('/api/pours', API_URL);
    url.search = params.toString();

    const response = await this.client.get<Pour[]>(url.toString());
    return response?.data ?? [];
  }

  async getPour(id: string): Promise<Pour> {
    const response = await this.client.get<Pour>(new URL(`/api/pours/${id}`, API_URL).toString());
    return response?.data ?? {} as Pour;
  }

  async updatePour(id: string, data: {
    whyItHit?: string;
    image?: string;
    flavorTagIds?: string[];
    isShared?: boolean;
    rating?: number | null;
    wouldPourAgain?: string | null;
    occasions?: string | null;
  }): Promise<Pour> {
    const response = await this.client.put<Pour>(new URL(`/api/pours/${id}`, API_URL).toString(), data);
    return response?.data ?? {} as Pour;
  }

  async deletePour(id: string): Promise<void> {
    await this.client.delete(new URL(`/api/pours/${id}`, API_URL).toString());
  }

  // Flavor Tags
  async getFlavorTags(): Promise<FlavorTag[]> {
    const response = await this.client.get<FlavorTag[]>(new URL('/api/flavor-tags', API_URL).toString());
    return response?.data ?? [];
  }

  // Image Search
  async searchBottleImages(query: string): Promise<string[]> {
    try {
      const response = await this.client.get<{ images: string[] }>(
        new URL(`/api/spirits/search-images?query=${encodeURIComponent(query)}`, API_URL).toString()
      );
      return response?.data?.images ?? [];
    } catch (error) {
      console.error('Failed to search bottle images:', error);
      return [];
    }
  }

  // File Upload
  async getPresignedUrl(data: { fileName: string; contentType: string; isPublic: boolean }): Promise<{ uploadUrl: string; cloud_storage_path: string; isPublic: boolean }> {
    try {
      console.log('API: Requesting presigned URL:', data);
      const response = await this.client.post<{ uploadUrl: string; cloud_storage_path: string; isPublic: boolean }>(
        new URL('/upload/presigned', API_URL).toString(), 
        data
      );
      console.log('API: Presigned URL response:', response?.data);
      return response?.data ?? { uploadUrl: '', cloud_storage_path: '', isPublic: false };
    } catch (error: any) {
      console.error('API: Failed to get presigned URL:', error?.response?.data ?? error?.message ?? error);
      throw error;
    }
  }

  async completeUpload(data: { cloud_storage_path: string; fileName: string; mimeType: string; fileSize: number }): Promise<{ id: string; cloud_storage_path: string; fileName: string; isPublic: boolean }> {
    const response = await this.client.post<{ id: string; cloud_storage_path: string; fileName: string; isPublic: boolean }>(
      new URL('/upload/complete', API_URL).toString(), 
      data
    );
    return response?.data ?? { id: '', cloud_storage_path: '', fileName: '', isPublic: false };
  }

  async getFileUrl(fileId: string, mode: 'view' | 'download' = 'view'): Promise<FileUrlResponse> {
    const response = await this.client.get<FileUrlResponse>(
      new URL(`/upload/files/${fileId}/url?mode=${mode}`, API_URL).toString()
    );
    return response?.data ?? { url: '' };
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.client.delete(new URL(`/upload/files/${fileId}`, API_URL).toString());
  }

  // Connections
  async searchUsers(query: string): Promise<Array<{ id: string; name: string; profilePhoto?: string; experienceLevel?: string; isConnected: boolean; hasPendingRequest: boolean }>> {
    const response = await this.client.get<Array<{ id: string; name: string; profilePhoto?: string; experienceLevel?: string; isConnected: boolean; hasPendingRequest: boolean }>>(
      new URL(`/api/connections/search?query=${encodeURIComponent(query)}`, API_URL).toString()
    );
    return response?.data ?? [];
  }

  async sendConnectionRequest(receiverEmail: string): Promise<Connection> {
    const response = await this.client.post<Connection>(
      new URL('/api/connections/send', API_URL).toString(),
      { receiverEmail }
    );
    return response?.data ?? {} as Connection;
  }

  async sendConnectionRequestById(userId: string): Promise<Connection> {
    const response = await this.client.post<Connection>(
      new URL(`/api/connections/send/${userId}`, API_URL).toString()
    );
    return response?.data ?? {} as Connection;
  }

  async acceptConnectionRequest(connectionId: string): Promise<Connection> {
    const response = await this.client.post<Connection>(
      new URL(`/api/connections/${connectionId}/accept`, API_URL).toString()
    );
    return response?.data ?? {} as Connection;
  }

  async removeConnection(connectionId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      new URL(`/api/connections/${connectionId}`, API_URL).toString()
    );
    return response?.data ?? { message: '' };
  }

  async getPendingRequests(): Promise<Connection[]> {
    const response = await this.client.get<Connection[]>(
      new URL('/api/connections/pending', API_URL).toString()
    );
    return response?.data ?? [];
  }

  async getSentRequests(): Promise<Connection[]> {
    const response = await this.client.get<Connection[]>(
      new URL('/api/connections/sent', API_URL).toString()
    );
    return response?.data ?? [];
  }

  async getConnections(): Promise<FellowSipper[]> {
    const response = await this.client.get<FellowSipper[]>(
      new URL('/api/connections', API_URL).toString()
    );
    return response?.data ?? [];
  }

  // Mute/Unmute
  async muteUser(userId: string): Promise<{ message: string; isMuted: boolean }> {
    const response = await this.client.post<{ message: string; isMuted: boolean }>(
      new URL(`/api/connections/mute/${userId}`, API_URL).toString()
    );
    return response?.data ?? { message: '', isMuted: true };
  }

  async unmuteUser(userId: string): Promise<{ message: string; isMuted: boolean }> {
    const response = await this.client.post<{ message: string; isMuted: boolean }>(
      new URL(`/api/connections/unmute/${userId}`, API_URL).toString()
    );
    return response?.data ?? { message: '', isMuted: false };
  }

  async getMuteStatus(userId: string): Promise<{ isMuted: boolean }> {
    const response = await this.client.get<{ isMuted: boolean }>(
      new URL(`/api/connections/mute-status/${userId}`, API_URL).toString()
    );
    return response?.data ?? { isMuted: false };
  }

  // Cheers
  async addCheer(pourId: string): Promise<{ id: string; createdAt: string }> {
    const response = await this.client.post<{ id: string; createdAt: string }>(
      new URL(`/api/cheers/${pourId}`, API_URL).toString()
    );
    return response?.data ?? { id: '', createdAt: '' };
  }

  async removeCheer(pourId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      new URL(`/api/cheers/${pourId}`, API_URL).toString()
    );
    return response?.data ?? { message: '' };
  }

  // The Bar Feed
  async getBarFeed(filters?: { category?: string; flavorTags?: string }): Promise<BarPour[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.flavorTags) params.append('flavorTags', filters.flavorTags);

    const url = new URL('/api/bar', API_URL);
    url.search = params.toString();

    const response = await this.client.get<BarPour[]>(url.toString());
    return response?.data ?? [];
  }

  // Universal Search
  async universalSearch(query: string): Promise<UniversalSearchResults> {
    console.log('[UniversalSearch] Search started for query:', query);
    
    if (!query || query.trim().length < 2) {
      console.log('[UniversalSearch] Query too short, returning empty results');
      return {
        users: [],
        spirits: [],
        distilleries: [],
        flavorTags: [],
        categories: [],
        locations: [],
        reviews: [],
      };
    }

    try {
      const searchUrl = new URL(`/api/search?q=${encodeURIComponent(query)}`, API_URL).toString();
      console.log('[UniversalSearch] Request URL:', searchUrl);
      console.log('[UniversalSearch] Making API call...');
      
      const response = await this.client.get<UniversalSearchResults>(searchUrl);
      
      console.log('[UniversalSearch] Response status:', response?.status);
      console.log('[UniversalSearch] Users found:', response?.data?.users?.length ?? 0);
      console.log('[UniversalSearch] Spirits found:', response?.data?.spirits?.length ?? 0);
      
      if (response?.data?.users && response.data.users.length > 0) {
        console.log('[UniversalSearch] USER RESULTS:', response.data.users.map((u: any) => u.name).join(', '));
      } else {
        console.log('[UniversalSearch] NO USERS FOUND');
      }
      
      return response?.data ?? {
        users: [],
        spirits: [],
        distilleries: [],
        flavorTags: [],
        categories: [],
        locations: [],
        reviews: [],
      };
    } catch (error: any) {
      console.error('[UniversalSearch] ERROR:', error?.message);
      console.error('[UniversalSearch] Error response:', error?.response?.status, error?.response?.data);
      throw error;
    }
  }

  // Radar (Wishlist)
  async addToRadar(spiritId: string): Promise<{ id: string; createdAt: string }> {
    const response = await this.client.post<{ id: string; createdAt: string }>(
      new URL(`/api/radar/${spiritId}`, API_URL).toString()
    );
    return response?.data ?? { id: '', createdAt: '' };
  }

  async removeFromRadar(spiritId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      new URL(`/api/radar/${spiritId}`, API_URL).toString()
    );
    return response?.data ?? { message: '' };
  }

  async getRadar(): Promise<RadarEntry[]> {
    const response = await this.client.get<RadarEntry[]>(
      new URL('/api/radar', API_URL).toString()
    );
    return response?.data ?? [];
  }

  // Badges & Gamification
  async getBadges(): Promise<Badge[]> {
    const response = await this.client.get<Badge[]>(
      new URL('/api/badges/me', API_URL).toString()
    );
    return response?.data ?? [];
  }

  async getTasteSummary(): Promise<TasteSummary> {
    const response = await this.client.get<TasteSummary>(
      new URL('/api/badges/taste-summary', API_URL).toString()
    );
    return response?.data ?? {
      flavorCount: 0,
      regionCount: 0,
      distilleryCount: 0,
      maxFlavors: 10,
      flavorDistribution: [],
      regions: [],
    };
  }

  // Seed / Admin
  async autoImportSpirits(): Promise<{ totalImported: number; connecticut: number; iowa: number; totalDuplicates: number }> {
    const response = await this.client.post(
      new URL('/api/seed/auto-import', API_URL).toString()
    );
    return response?.data?.details ?? response?.data ?? { totalImported: 0, connecticut: 0, iowa: 0, totalDuplicates: 0 };
  }

  async uploadCsvForImport(fileUri: string): Promise<{ totalImported: number }> {
    const formData = new FormData();
    
    // Create file object for upload
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();
    
    formData.append('file', blob as any, 'import.csv');

    const response = await this.client.post(
      new URL('/api/seed/upload-csv', API_URL).toString(),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response?.data?.details ?? response?.data ?? { totalImported: 0 };
  }

  async getSeedStats(): Promise<{ totalSpirits: number; totalDistilleries: number; spiritsWithImages: number; spiritsWithoutImages: number }> {
    const response = await this.client.post(
      new URL('/api/seed/get-stats', API_URL).toString()
    );
    return response?.data ?? { totalSpirits: 0, totalDistilleries: 0, spiritsWithImages: 0, spiritsWithoutImages: 0 };
  }

  // Spirit Details & Shelf
  async getSpiritDetails(spiritId: string): Promise<Spirit> {
    const response = await this.client.get(
      new URL(`/api/spirits/${spiritId}`, API_URL).toString()
    );
    return response?.data ?? null;
  }

  async addToShelf(spiritId: string): Promise<void> {
    await this.client.post(
      new URL(`/api/radar/${spiritId}`, API_URL).toString()
    );
  }

  // Distilleries
  async getDistilleriesDiscover(): Promise<DistilleryDiscoverData> {
    const response = await this.client.get<DistilleryDiscoverData>(
      new URL('/api/distilleries/discover', API_URL).toString()
    );
    return response?.data ?? { mapPins: [], trending: [] };
  }

  async getDistilleryProfile(distilleryId: string): Promise<DistilleryProfile> {
    const response = await this.client.get<DistilleryProfile>(
      new URL(`/api/distilleries/${distilleryId}/profile`, API_URL).toString()
    );
    return response?.data ?? {} as DistilleryProfile;
  }

  async getDistilleryPours(distilleryId: string): Promise<DistilleryPour[]> {
    const response = await this.client.get<DistilleryPour[]>(
      new URL(`/api/distilleries/${distilleryId}/pours`, API_URL).toString()
    );
    return response?.data ?? [];
  }

  async getDistillerySpirits(distilleryId: string): Promise<DistillerySpirit[]> {
    const response = await this.client.get<DistillerySpirit[]>(
      new URL(`/api/distilleries/${distilleryId}/spirits`, API_URL).toString()
    );
    return response?.data ?? [];
  }

  async followDistillery(distilleryId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    const response = await this.client.post<{ isFollowing: boolean; followersCount: number }>(
      new URL(`/api/distilleries/${distilleryId}/follow`, API_URL).toString()
    );
    return response?.data ?? { isFollowing: false, followersCount: 0 };
  }

  async savePushToken(token: string): Promise<{ message: string }> {
    const response = await this.client.post(new URL('/api/profile/push-token', API_URL).toString(), { token });
    return (response?.data as any) ?? { message: '' };
  }

  async getExperienceBreakdown(): Promise<{
    level: string;
    stats: { pours: number; sharedPours: number; sharedPercent: number; categories: number; regions: number; connections: number };
    nextLevel: string | null;
    needs: string[];
  }> {
    const response = await this.client.get(new URL('/api/profile/experience-breakdown', API_URL).toString());
    return (response?.data as any) ?? { level: 'Curious', stats: {}, nextLevel: null, needs: [] };
  }

  async resolveSpirit(name: string, distillery?: string): Promise<{ found: boolean; spirit?: Spirit }> {
    const url = new URL('/api/spirits/resolve', API_URL);
    url.searchParams.set('name', name);
    if (distillery) url.searchParams.set('distillery', distillery);
    const response = await this.client.get(url.toString());
    return (response?.data as any) ?? { found: false };
  }

  async getSpiritPourCount(spiritId: string): Promise<{ spiritId: string; pourCount: number }> {
    const response = await this.client.get(new URL(`/api/spirits/${spiritId}/pour-count`, API_URL).toString());
    return (response?.data as any) ?? { spiritId, pourCount: 0 };
  }

  async getReceivedCheers(): Promise<{ id: string; createdAt: string; user: { id: string; name: string; profilePhoto?: string }; pourId: string; spiritName: string }[]> {
    const response = await this.client.get(new URL('/api/cheers/received', API_URL).toString());
    return (response?.data as any) ?? [];
  }

  async updateDistilleryProfile(
    distilleryId: string,
    data: { name?: string; bio?: string; logo?: string; heroImage?: string; region?: string; country?: string; spiritTypes?: string },
  ): Promise<any> {
    const response = await this.client.put(
      new URL(`/api/distilleries/${distilleryId}/profile`, API_URL).toString(),
      data
    );
    return response?.data;
  }

  async addShelfSpirit(
    distilleryId: string,
    data: { name: string; category?: string; style?: string; abv?: number; region?: string; bottleImage: string; officialTastingNotes?: string; flavorTagIds?: string[] },
  ): Promise<any> {
    const response = await this.client.post(
      new URL(`/api/distilleries/${distilleryId}/shelf/spirits`, API_URL).toString(),
      data
    );
    return response?.data;
  }

  async updateShelfSpirit(
    distilleryId: string,
    spiritId: string,
    data: { name?: string; category?: string; style?: string; abv?: number; region?: string; bottleImage?: string; officialTastingNotes?: string; flavorTagIds?: string[] },
  ): Promise<any> {
    const response = await this.client.put(
      new URL(`/api/distilleries/${distilleryId}/shelf/spirits/${spiritId}`, API_URL).toString(),
      data
    );
    return response?.data;
  }

  async deleteShelfSpirit(distilleryId: string, spiritId: string): Promise<any> {
    const response = await this.client.delete(
      new URL(`/api/distilleries/${distilleryId}/shelf/spirits/${spiritId}`, API_URL).toString()
    );
    return response?.data;
  }

  async getDistilleryAnalytics(distilleryId: string): Promise<DistilleryAnalytics> {
    const response = await this.client.get<DistilleryAnalytics>(
      new URL(`/api/distilleries/${distilleryId}/analytics`, API_URL).toString()
    );
    return response?.data ?? { overview: { totalPours: 0, totalFollowers: 0, totalSpiritsOnRadar: 0, averageRating: 0 }, topSpirits: [], topFlavorTags: [], monthlyPours: [] };
  }

  async seedTestDistilleries(): Promise<{ message: string; count: number }> {
    const response = await this.client.post<{ message: string; count: number }>(
      new URL('/api/seed/seed-test-distilleries', API_URL).toString()
    );
    return response?.data ?? { message: '', count: 0 };
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const response = await this.client.get<T>(new URL(endpoint, API_URL).toString());
    return { data: response?.data ?? {} as T };
  }

  async post<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const response = await this.client.post<T>(new URL(endpoint, API_URL).toString(), data);
    return { data: response?.data ?? {} as T };
  }
}

export const apiService = new ApiService();
// BUILD_CACHE_BUSTER_1772793701
