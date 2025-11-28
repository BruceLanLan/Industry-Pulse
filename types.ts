export enum ViewMode {
  BRIEFING = 'BRIEFING',
  AGGREGATOR = 'AGGREGATOR',
  SETTINGS = 'SETTINGS',
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  SAVED = 'SAVED',
  DASHBOARD = 'DASHBOARD'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface NewsCardData {
  id: string; 
  title: string;
  summary: string;
  tags: string[];
  timestamp?: number;
}

export interface AssetAnalysis {
  ticker: string;
  name: string;
  price: string;
  change: string;
  reason: string;
}

export interface BriefingData {
  industry: string;
  date: string;
  timeRange: string;
  summary: string;
  macroSummary: string; // New: Macro Market Overview
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  sentimentScore: number;
  fearGreedIndex: { value: string; label: string }; // New: F&G
  keyTrends: string[];
  stockAnalysis: AssetAnalysis[]; // New: Specific Stock Analysis
  cryptoAnalysis: AssetAnalysis[]; // New: Specific Crypto Analysis
  rawText: string;
  sources: GroundingSource[];
  newsItems: NewsCardData[];
}

export interface AppState {
  currentIndustry: string;
  isLoading: boolean;
  data: BriefingData | null;
  error: string | null;
  lastUpdated: number | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CryptoTicker {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string; 
  highPrice: string; 
  lowPrice: string;  
}

export interface StockTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export interface LongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}
