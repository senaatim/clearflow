import { create } from 'zustand';
import type { Portfolio, Asset, DashboardStats } from '@/types';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  assets: Asset[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;

  // Actions
  setPortfolios: (portfolios: Portfolio[]) => void;
  setSelectedPortfolio: (portfolio: Portfolio | null) => void;
  addPortfolio: (portfolio: Portfolio) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  removePortfolio: (id: string) => void;
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  setDashboardStats: (stats: DashboardStats | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolios: [],
  selectedPortfolio: null,
  assets: [],
  dashboardStats: null,
  isLoading: false,

  setPortfolios: (portfolios) => set({ portfolios }),

  setSelectedPortfolio: (portfolio) => set({ selectedPortfolio: portfolio }),

  addPortfolio: (portfolio) => set((state) => ({
    portfolios: [...state.portfolios, portfolio],
  })),

  updatePortfolio: (id, updates) => set((state) => ({
    portfolios: state.portfolios.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
    selectedPortfolio:
      state.selectedPortfolio?.id === id
        ? { ...state.selectedPortfolio, ...updates }
        : state.selectedPortfolio,
  })),

  removePortfolio: (id) => set((state) => ({
    portfolios: state.portfolios.filter((p) => p.id !== id),
    selectedPortfolio:
      state.selectedPortfolio?.id === id ? null : state.selectedPortfolio,
  })),

  setAssets: (assets) => set({ assets }),

  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset],
  })),

  updateAsset: (id, updates) => set((state) => ({
    assets: state.assets.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),

  removeAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id),
  })),

  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  setLoading: (isLoading) => set({ isLoading }),
}));
