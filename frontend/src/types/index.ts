// User types
export type UserRole = 'user' | 'broker' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoal?: string;
  createdAt: string;
  isVerified: boolean;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Portfolio types
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'investment' | 'retirement' | 'savings';
  currency: string;
  targetAllocation?: Record<string, number>;
  autoRebalance: boolean;
  rebalanceThreshold: number;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  totalValue?: number;
  totalReturn?: number;
  returnPercentage?: number;
}

export interface Asset {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'etf' | 'bond' | 'crypto' | 'reit';
  category: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  lastPriceUpdate?: string;
  // Computed
  currentValue?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  assetId?: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal';
  symbol?: string;
  quantity?: number;
  price?: number;
  totalAmount: number;
  fees: number;
  notes?: string;
  executedAt: string;
  createdAt: string;
}

// Recommendation types
export interface Recommendation {
  id: string;
  userId: string;
  portfolioId?: string;
  type: 'rebalance' | 'buy' | 'sell' | 'tax_harvest' | 'risk_alert' | 'opportunity';
  title: string;
  description: string;
  details?: Record<string, unknown>;
  confidenceScore?: number;
  potentialImpact?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'viewed' | 'accepted' | 'dismissed';
  expiresAt?: string;
  createdAt: string;
  actedAt?: string;
}

// Analytics types
export interface MarketTrend {
  symbol: string;
  name: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  change: number;
  changePercent: number;
  volume: number;
}

export interface Prediction {
  symbol: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  targetPrice: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  generatedAt: string;
}

export interface SectorOutlook {
  sector: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  strength: number;
  trendingStocks: string[];
}

// Risk types
export interface RiskScore {
  overall: number;
  diversification: number;
  concentration: number;
  positionSize: number;
  volatility: number;
  correlation: number;
  recommendation: string;
}

export interface StressTestResult {
  scenario: string;
  description: string;
  portfolioImpact: number;
  percentageChange: number;
  affectedAssets: {
    symbol: string;
    impact: number;
  }[];
}

export interface VolatilityData {
  date: string;
  volatility: number;
  benchmark: number;
}

// Tax types
export interface TaxSummary {
  year: number;
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netGainLoss: number;
  shortTermGains: number;
  longTermGains: number;
  estimatedTaxLiability: number;
}

export interface TaxHarvestingOpportunity {
  assetId: string;
  symbol: string;
  unrealizedLoss: number;
  potentialTaxSavings: number;
  suggestedReplacement?: string;
  washSaleRisk: boolean;
}

// Report types
export interface Report {
  id: string;
  userId: string;
  portfolioId?: string;
  type: 'performance' | 'tax' | 'risk' | 'comprehensive';
  title: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

// Automation types
export interface AutomationRule {
  id: string;
  userId: string;
  portfolioId?: string;
  name: string;
  type: 'rebalance' | 'contribution' | 'alert';
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

// User settings
export interface UserSettings {
  notificationsEnabled: boolean;
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'none';
  autoInvestEnabled: boolean;
  autoInvestAmount?: number;
  autoInvestFrequency?: 'weekly' | 'biweekly' | 'monthly';
  taxOptimizationEnabled: boolean;
  theme: 'dark' | 'light';
  timezone: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Dashboard stats
export interface DashboardStats {
  totalPortfolioValue: number;
  totalReturns: number;
  returnPercentage: number;
  monthlyContribution: number;
  nextContributionDate?: string;
  riskScore: number;
  riskLevel: string;
  monthlyChange: number;
  monthlyChangePercentage: number;
}

// Chart data
export interface PerformanceDataPoint {
  date: string;
  value: number;
  benchmark?: number;
}

export interface AllocationData {
  name: string;
  type: string;
  percentage: number;
  value: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'dividend' | 'rebalance' | 'contribution' | 'milestone' | 'buy' | 'sell';
  title: string;
  description: string;
  amount?: number;
  changePercent?: number;
  timestamp: string;
}

export interface InsightItem {
  id: string;
  type: 'rebalance' | 'opportunity' | 'tax' | 'alert';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
}

// Subscription types
export type SubscriptionTier = 'basic' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionWithFeatures extends Subscription {
  features: string[];
  tierName: string;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export interface TierFeature {
  name: string;
  description: string;
  included: boolean;
}

export interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: TierFeature[];
  popular: boolean;
}

export interface SubscriptionInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

// Payment types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'mobile_money';

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// Trade Request types
export type TradeAction = 'buy' | 'sell' | 'rebalance';
export type OrderType = 'market' | 'limit';
export type TradeRequestStatus = 'pending' | 'confirmed' | 'executed' | 'rejected' | 'canceled';
export type RiskLevel = 'low' | 'medium' | 'high';
export type GrowthOutlook = 'short_term' | 'long_term';

export interface TradeRequest {
  id: string;
  userId: string;
  recommendationId?: string;
  portfolioId: string;
  action: TradeAction;
  symbol: string;
  companyName?: string;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  estimatedPrice?: number;
  estimatedTotal?: number;
  riskLevel?: RiskLevel;
  growthOutlook?: GrowthOutlook;
  aiReasoning?: string;
  status: TradeRequestStatus;
  brokerNotes?: string;
  executedPrice?: number;
  executedQuantity?: number;
  executionFees?: number;
  executedAt?: string;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRequestList {
  trades: TradeRequest[];
  totalCount: number;
  pendingCount: number;
  executedCount: number;
}

// Stock Recommendation with execution support
export interface StockRecommendation extends Recommendation {
  symbol?: string;
  companyName?: string;
  currentPrice?: number;
  targetPrice?: number;
  riskLevel?: RiskLevel;
  growthOutlook?: GrowthOutlook;
  sector?: string;
}

// Fund Request types
export type FundingMethod = 'bank' | 'card' | 'mobile_money';
export type FundRequestStatus = 'pending' | 'approved' | 'rejected' | 'canceled';

export interface FundRequest {
  id: string;
  userId: string;
  amount: number;
  method: FundingMethod;
  status: FundRequestStatus;
  userNotes?: string;
  adminNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingDeposits: number;
  pendingTrades: number;
  totalAum: number;
  totalDepositsToday: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminFundRequest extends FundRequest {
  userName: string;
  userEmail: string;
}

export interface AdminTrade {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  portfolioId: string;
  action: string;
  symbol: string;
  companyName?: string;
  quantity: number;
  orderType: string;
  estimatedPrice?: number;
  estimatedTotal?: number;
  status: string;
  brokerNotes?: string;
  executedPrice?: number;
  executedQuantity?: number;
  executionFees?: number;
  createdAt: string;
  executedAt?: string;
}

export interface AdminPortfolio {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  name: string;
  type: string;
  currency: string;
  totalValue?: number;
  createdAt: string;
}

export interface AdminTransaction {
  id: string;
  portfolioId: string;
  userName: string;
  type: string;
  symbol?: string;
  quantity?: number;
  price?: number;
  totalAmount: number;
  executedAt: string;
}
