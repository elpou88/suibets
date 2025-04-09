// Types for sports events
export interface SportEvent {
  id: string;
  sportId: number;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'finished';
  score?: string;
  markets: MarketData[];
  isLive: boolean;
}

// Types for market data
export interface MarketData {
  id: string;
  name: string;
  outcomes: OutcomeData[];
}

// Types for outcome data
export interface OutcomeData {
  id: string;
  name: string;
  odds: number;
  probability: number;
}

// Types for odds data
export interface OddsData {
  providerId: string;
  eventId: string;
  marketId: string;
  marketName: string;
  outcomes: OutcomeData[];
}

// Types for normalized odds data (for the aggregator)
export interface NormalizedOdds {
  outcomeId: string;
  marketId: string;
  eventId: string;
  value: number;
  providerId: string;
  timestamp: Date;
  confidence: number;
}

// Types for bet data
export interface BetData {
  id: string;
  userId: string;
  eventId: string;
  marketId: string;
  outcomeId: string;
  odds: number;
  stake: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost' | 'void' | 'cash_out';
  placedAt: string;
  settledAt?: string;
  cashOutValue?: number;
}

// Provider configuration
export interface OddsProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  weight: number;
}

// API response format
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}