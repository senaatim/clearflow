import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// --- Case conversion utilities ---

function snakeToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, val]) => [
        key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        snakeToCamel(val),
      ])
    );
  }
  return obj;
}

function camelToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, val]) => [
        key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
        camelToSnake(val),
      ])
    );
  }
  return obj;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request interceptor to convert camelCase to snake_case and add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert request body and params to snake_case
    if (config.data && typeof config.data === 'object') {
      config.data = camelToSnake(config.data);
    }
    if (config.params && typeof config.params === 'object') {
      config.params = camelToSnake(config.params);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for snake_case to camelCase conversion and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Convert response data from snake_case to camelCase (skip blobs)
    if (response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
      response.data = snakeToCamel(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const accessToken = response.data.access_token;
          useAuthStore.getState().setAccessToken(accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// API error handler
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
    return axiosError.response?.data?.message ||
           axiosError.response?.data?.detail ||
           axiosError.message ||
           'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; nin: string; bvn: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  me: () => apiClient.get('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};

// Portfolio API
export const portfolioApi = {
  list: () => apiClient.get('/portfolios'),

  create: (data: { name: string; type: string; description?: string }) =>
    apiClient.post('/portfolios', data),

  get: (id: string) => apiClient.get(`/portfolios/${id}`),

  update: (id: string, data: Partial<{ name: string; description: string; targetAllocation: Record<string, number> }>) =>
    apiClient.patch(`/portfolios/${id}`, data),

  delete: (id: string) => apiClient.delete(`/portfolios/${id}`),

  getPerformance: (id: string, period: string = '1m') =>
    apiClient.get(`/portfolios/${id}/performance`, { params: { period } }),

  getAllocation: (id: string) => apiClient.get(`/portfolios/${id}/allocation`),

  rebalance: (id: string) => apiClient.post(`/portfolios/${id}/rebalance`),
};

// Asset API
export const assetApi = {
  list: (portfolioId: string) => apiClient.get(`/portfolios/${portfolioId}/assets`),

  add: (portfolioId: string, data: { symbol: string; name: string; assetType: string; category: string; quantity: number; averageCost: number }) =>
    apiClient.post(`/portfolios/${portfolioId}/assets`, data),

  update: (assetId: string, data: Partial<{ quantity: number; averageCost: number }>) =>
    apiClient.patch(`/assets/${assetId}`, data),

  remove: (assetId: string) => apiClient.delete(`/assets/${assetId}`),
};

// Transaction API
export const transactionApi = {
  list: (portfolioId: string, params?: { type?: string; limit?: number; offset?: number }) =>
    apiClient.get(`/portfolios/${portfolioId}/transactions`, { params }),

  create: (portfolioId: string, data: { type: string; symbol?: string; quantity?: number; price?: number; totalAmount: number }) =>
    apiClient.post(`/portfolios/${portfolioId}/transactions`, data),

  get: (transactionId: string) => apiClient.get(`/transactions/${transactionId}`),
};

// Recommendations API
export const recommendationApi = {
  list: (params?: { status?: string; type?: string; limit?: number }) =>
    apiClient.get('/recommendations', { params }),

  get: (id: string) => apiClient.get(`/recommendations/${id}`),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/recommendations/${id}`, { status }),

  accept: (id: string) => apiClient.post(`/recommendations/${id}/accept`),

  generate: (portfolioId?: string) =>
    apiClient.post('/recommendations/generate', { portfolioId }),
};

// Analytics API
export const analyticsApi = {
  getMarketTrends: (params?: { sectors?: string; period?: string }) =>
    apiClient.get('/analytics/market-trends', { params }),

  getPredictions: (params?: { symbols?: string }) =>
    apiClient.get('/analytics/predictions', { params }),

  getSentiment: (sector?: string) =>
    apiClient.get('/analytics/sentiment', { params: { sector } }),

  getCorrelations: (portfolioId?: string) =>
    apiClient.get('/analytics/correlations', { params: { portfolioId } }),
};

// Risk API
export const riskApi = {
  getScore: (portfolioId?: string) =>
    apiClient.get('/risk/score', { params: { portfolioId } }),

  getVolatility: (portfolioId?: string, period?: string) =>
    apiClient.get('/risk/volatility', { params: { portfolioId, period } }),

  runStressTest: (portfolioId: string, scenario: string) =>
    apiClient.post('/risk/stress-test', { portfolioId, scenario }),

  getAlerts: (portfolioId?: string) =>
    apiClient.get('/risk/alerts', { params: { portfolioId } }),
};

// Tax API
export const taxApi = {
  getSummary: (year?: number) =>
    apiClient.get('/tax/summary', { params: { year } }),

  getHarvestingOpportunities: (portfolioId?: string) =>
    apiClient.get('/tax/harvesting', { params: { portfolioId } }),

  getGainsLosses: (params?: { year?: number; portfolioId?: string }) =>
    apiClient.get('/tax/gains-losses', { params }),

  calculateImpact: (transactions: unknown[]) =>
    apiClient.post('/tax/calculate', { transactions }),
};

// Reports API
export const reportApi = {
  list: () => apiClient.get('/reports'),

  generate: (data: { type: string; portfolioId?: string; dateRange?: { start: string; end: string } }) =>
    apiClient.post('/reports/generate', data),

  get: (id: string) => apiClient.get(`/reports/${id}`),

  download: (id: string, format: 'pdf' | 'csv' = 'pdf') =>
    apiClient.get(`/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    }),
};

// Automation API
export const automationApi = {
  listRules: () => apiClient.get('/automation/rules'),

  createRule: (data: { name: string; type: string; conditions: unknown; actions: unknown }) =>
    apiClient.post('/automation/rules', data),

  updateRule: (id: string, data: Partial<{ name: string; conditions: unknown; actions: unknown }>) =>
    apiClient.patch(`/automation/rules/${id}`, data),

  deleteRule: (id: string) => apiClient.delete(`/automation/rules/${id}`),

  toggleRule: (id: string, isActive: boolean) =>
    apiClient.post(`/automation/rules/${id}/toggle`, { isActive }),
};

// Market Data API
export const marketApi = {
  getQuote: (symbol: string) => apiClient.get(`/market/quote/${symbol}`),

  getHistorical: (symbol: string, params?: { period?: string; interval?: string }) =>
    apiClient.get(`/market/historical/${symbol}`, { params }),

  search: (query: string) =>
    apiClient.get('/market/search', { params: { query } }),
};

// User API
export const userApi = {
  getProfile: () => apiClient.get('/users/profile'),

  updateProfile: (data: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string }>) =>
    apiClient.patch('/users/profile', data),

  getSettings: () => apiClient.get('/users/settings'),

  updateSettings: (data: Partial<Record<string, unknown>>) =>
    apiClient.patch('/users/settings', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch('/users/password', data),
};

// Subscription API
export const subscriptionApi = {
  getTiers: () => apiClient.get('/subscriptions/tiers'),

  getCurrent: () => apiClient.get('/subscriptions/current'),

  subscribe: (data: { tier: string; billingPeriod?: string }) =>
    apiClient.post('/subscriptions/subscribe', data),

  upgrade: (tier: string) =>
    apiClient.post('/subscriptions/upgrade', { tier }),

  cancel: () => apiClient.post('/subscriptions/cancel'),

  reactivate: () => apiClient.post('/subscriptions/reactivate'),

  getInvoices: () => apiClient.get('/subscriptions/invoices'),
};

// Payment API
export const paymentApi = {
  createIntent: (data: { tier: string; billingPeriod?: string }) =>
    apiClient.post('/payments/create-intent', data),

  confirm: (paymentIntentId: string) =>
    apiClient.post('/payments/confirm', { paymentIntentId }),

  getHistory: (params?: { limit?: number; offset?: number }) =>
    apiClient.get('/payments/history', { params }),
};

// AI Advisor API
export const aiApi = {
  // Stock Analysis
  analyzeStock: (symbol: string) =>
    apiClient.get(`/ai/stock/${symbol}`),

  getStockQuote: (symbol: string) =>
    apiClient.get(`/ai/stock/${symbol}/quote`),

  getStockHistory: (symbol: string, period: string = '1mo') =>
    apiClient.get(`/ai/stock/${symbol}/history`, { params: { period } }),

  getTechnicals: (symbol: string) =>
    apiClient.get(`/ai/stock/${symbol}/technicals`),

  // Recommendations
  generateRecommendations: (data?: { symbols?: string[]; count?: number }) =>
    apiClient.post('/ai/recommendations', data || {}),

  getQuickRecommendations: (count: number = 5) =>
    apiClient.get('/ai/recommendations/quick', { params: { count } }),

  // Portfolio Analysis
  analyzePortfolio: (holdings: Array<{ symbol: string; quantity: number; averageCost: number }>) =>
    apiClient.post('/ai/portfolio/analyze', { holdings }),

  // Market
  getMarketSummary: () =>
    apiClient.get('/ai/market/summary'),

  getMarketInsights: () =>
    apiClient.get('/ai/market/insights'),

  // News
  getMarketNews: (limit: number = 20) =>
    apiClient.get('/ai/news', { params: { limit } }),

  getStockNews: (symbol: string, limit: number = 10) =>
    apiClient.get(`/ai/news/${symbol}`, { params: { limit } }),

  // Search
  searchStocks: (query: string, limit: number = 10) =>
    apiClient.get('/ai/search', { params: { query, limit } }),

  // AI Q&A
  askQuestion: (question: string, context?: Record<string, unknown>, conversationId?: string) =>
    apiClient.post('/ai/ask', { question, context, conversationId }),

  // Conversations
  listConversations: (limit?: number) =>
    apiClient.get('/ai/conversations', { params: { limit } }),

  getConversation: (id: string) =>
    apiClient.get(`/ai/conversations/${id}`),

  deleteConversation: (id: string) =>
    apiClient.delete(`/ai/conversations/${id}`),
};

// Trade Request API
export const tradeApi = {
  list: (params?: { statusFilter?: string; limit?: number; offset?: number }) =>
    apiClient.get('/trades', { params }),

  create: (data: {
    portfolioId: string;
    recommendationId?: string;
    action: string;
    symbol: string;
    companyName?: string;
    quantity: number;
    orderType?: string;
    limitPrice?: number;
    estimatedPrice?: number;
    riskLevel?: string;
    growthOutlook?: string;
    aiReasoning?: string;
    userNotes?: string;
  }) => apiClient.post('/trades', data),

  requestExecution: (data: {
    recommendationId: string;
    portfolioId: string;
    quantity: number;
    orderType?: string;
    limitPrice?: number;
    userNotes?: string;
  }) => apiClient.post('/trades/request-execution', data),

  get: (id: string) => apiClient.get(`/trades/${id}`),

  cancel: (id: string) => apiClient.post(`/trades/${id}/cancel`),

  update: (id: string, data: {
    status?: string;
    brokerNotes?: string;
    executedPrice?: number;
    executedQuantity?: number;
    executionFees?: number;
  }) => apiClient.patch(`/trades/${id}`, data),

  confirm: (id: string, data: {
    executedPrice: number;
    executedQuantity?: number;
    executionFees?: number;
    brokerNotes?: string;
  }) => apiClient.post(`/trades/${id}/confirm`, null, { params: data }),
};

// Fund Request API (user-facing)
export const fundApi = {
  create: (data: { amount: number; method: string; userNotes?: string }) =>
    apiClient.post('/funds', data),

  list: (params?: { statusFilter?: string; limit?: number; offset?: number }) =>
    apiClient.get('/funds', { params }),

  get: (id: string) => apiClient.get(`/funds/${id}`),

  cancel: (id: string) => apiClient.post(`/funds/${id}/cancel`),
};

// Admin API
export const adminApi = {
  // Dashboard
  getStats: () => apiClient.get('/admin/stats'),

  // Users
  listUsers: (params?: { search?: string; limit?: number; offset?: number }) =>
    apiClient.get('/admin/users', { params }),

  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),

  updateUser: (id: string, data: { isActive?: boolean; role?: string }) =>
    apiClient.patch(`/admin/users/${id}`, data),

  reviewUser: (id: string, data: { action: 'approve' | 'reject'; notes?: string }) =>
    apiClient.post(`/admin/users/${id}/review`, data),

  // Fund requests
  listFundRequests: (params?: { statusFilter?: string; limit?: number; offset?: number }) =>
    apiClient.get('/admin/fund-requests', { params }),

  reviewFundRequest: (id: string, data: { status: string; adminNotes?: string }) =>
    apiClient.post(`/admin/fund-requests/${id}/review`, data),

  // Trades
  listTrades: (params?: { statusFilter?: string; limit?: number; offset?: number }) =>
    apiClient.get('/admin/trades', { params }),

  executeTrade: (id: string, data: { executedPrice: number; executedQuantity?: number; executionFees?: number; brokerNotes?: string }) =>
    apiClient.post(`/admin/trades/${id}/execute`, data),

  rejectTrade: (id: string, data: { brokerNotes?: string }) =>
    apiClient.post(`/admin/trades/${id}/reject`, data),

  // Portfolios & Transactions
  listPortfolios: (params?: { limit?: number; offset?: number }) =>
    apiClient.get('/admin/portfolios', { params }),

  listTransactions: (params?: { limit?: number; offset?: number }) =>
    apiClient.get('/admin/transactions', { params }),
};

// Screener API
export const screenerApi = {
  getStocks: (params?: { sector?: string; minPe?: number; maxPe?: number; minHealth?: number; minDividend?: number; minRevenueGrowth?: number; sortBy?: string; limit?: number }) =>
    apiClient.get('/screener/stocks', { params }),

  getSectors: () => apiClient.get('/screener/sectors'),
};

// Health Cards API
export const healthCardsApi = {
  list: () => apiClient.get('/health-cards/'),

  get: (symbol: string) => apiClient.get(`/health-cards/${symbol}`),
};

// News API
export const newsApi = {
  list: (params?: { category?: string; symbol?: string; limit?: number }) =>
    apiClient.get('/news/', { params }),
};

// NGX Module API
export const ngxApi = {
  getSummary: () => apiClient.get('/ngx/summary'),

  getMovers: () => apiClient.get('/ngx/movers'),

  getStocks: () => apiClient.get('/ngx/stocks'),
};

export default apiClient;
