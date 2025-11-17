//### Path: `frontend/src/types/index.ts`

// frontend/src/types/index.ts
// TypeScript type definitions

export interface User {
  account_id: string;
  email?: string;
  username?: string;
  created_at: string;
}

export interface Trade {
  order_id: string;
  seller_account_id: string;
  buyer_account_id?: string;
  energy_amount: number;
  price_per_kwh: number;
  total_price: number;
  grid_zone: string;
  energy_source: EnergySource;
  status: OrderStatus;
  created_at: string;
  completed_at?: string;
}

export enum EnergySource {
  Solar = 'Solar',
  Wind = 'Wind',
  Hydro = 'Hydro',
  Geothermal = 'Geothermal',
  Battery = 'Battery',
  Mixed = 'Mixed',
}

export enum OrderStatus {
  Open = 'Open',
  Matched = 'Matched',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export interface Device {
  id: number;
  owner_account_id: string;
  device_type: EnergySource;
  capacity_kwh: number;
  verified: boolean;
  did_reference: string;
  registered_at: string;
}

export interface StakeInfo {
  staked_amount: string;
  reward_accumulated: string;
  last_claim_block: number;
  energy_contributed_kwh: number;
  data_contributions: number;
  is_active: boolean;
}

export interface LeaderboardEntry {
  account_id: string;
  username?: string;
  total_energy_kwh: number;
  total_trades: number;
  reputation_tier: ReputationTier;
  rank: number;
}

export enum ReputationTier {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum',
  Diamond = 'Diamond',
}

export interface DashboardData {
  summary: {
    total_energy_traded: string;
    total_trades: string;
    unique_sellers: string;
    unique_buyers: string;
  };
  byEnergySource: Array<{
    energy_source: string;
    total_energy: string;
    trade_count: string;
    percentage?: string;
  }>;
  recentTrades: Trade[];
}

export interface GridMetric {
  data_type: string;
  value: number;
  unit: string;
  timestamp: string;
  data_source: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}
