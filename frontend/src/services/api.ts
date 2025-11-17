//### Path: `frontend/src/services/api.ts`

// frontend/src/services/api.ts
// API client service

import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
      }
    );
  }

  // Trades
  async getActiveTrades(params?: any): Promise<AxiosResponse> {
    return this.client.get('/api/v1/trades/active', { params });
  }

  async createTrade(data: any): Promise<AxiosResponse> {
    return this.client.post('/api/v1/trades/create', data);
  }

  async buyEnergy(orderId: string): Promise<AxiosResponse> {
    return this.client.post('/api/v1/trades/buy', { orderId });
  }

  async getTradeHistory(limit?: number): Promise<AxiosResponse> {
    return this.client.get('/api/v1/trades/history', { params: { limit } });
  }

  // Users
  async registerUser(data: any): Promise<AxiosResponse> {
    return this.client.post('/api/v1/users/register', data);
  }

  async getUserProfile(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/users/profile');
  }

  async getUserStats(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/users/stats');
  }

  // Devices
  async registerDevice(data: any): Promise<AxiosResponse> {
    return this.client.post('/api/v1/devices/register', data);
  }

  async getDeviceList(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/devices/list');
  }

  // Staking
  async stakeTokens(amount: string): Promise<AxiosResponse> {
    return this.client.post('/api/v1/staking/stake', { amount });
  }

  async claimRewards(): Promise<AxiosResponse> {
    return this.client.post('/api/v1/staking/claim');
  }

  async getStakingInfo(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/staking/info');
  }

  async getLeaderboard(limit?: number): Promise<AxiosResponse> {
    return this.client.get('/api/v1/staking/leaderboard', { params: { limit } });
  }

  // Analytics
  async getDashboard(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/analytics/dashboard');
  }

  async getGridPerformance(params?: any): Promise<AxiosResponse> {
    return this.client.get('/api/v1/analytics/grid-performance', { params });
  }

  async getPriceTrends(params?: any): Promise<AxiosResponse> {
    return this.client.get('/api/v1/analytics/price-trends', { params });
  }

  async getEnergyMix(params?: any): Promise<AxiosResponse> {
    return this.client.get('/api/v1/analytics/energy-mix', { params });
  }

  // Grid
  async getGridStatus(gridZone?: string): Promise<AxiosResponse> {
    return this.client.get('/api/v1/grid/status', { params: { gridZone } });
  }

  async getGridPrices(gridZone: string): Promise<AxiosResponse> {
    return this.client.get('/api/v1/grid/prices', { params: { gridZone } });
  }

  async getGridZones(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/grid/zones');
  }
}

export default new ApiService();
