'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, TrendingDown, MoreVertical, FolderPlus, X } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { portfolioApi, assetApi } from '@/lib/api-client';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  category: string;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

const ASSET_TYPE_OPTIONS = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: 'Bond' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'reit', label: 'REIT' },
];

const DEFAULT_FORM = {
  symbol: '',
  name: '',
  assetType: 'stock',
  category: '',
  quantity: '',
  averageCost: '',
};

function enrichAssets(assets: Record<string, unknown>[]): Holding[] {
  return assets.map((a) => {
    const shares = (a.quantity as number) || 0;
    const avgCost = (a.averageCost as number) || 0;
    const currentPrice = (a.currentPrice as number) || avgCost;
    const currentValue = shares * currentPrice;
    const costBasis = shares * avgCost;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    return {
      id: (a.id as string) || '',
      symbol: (a.symbol as string) || '',
      name: (a.name as string) || (a.symbol as string) || '',
      shares,
      avgCost,
      currentPrice,
      category: (a.category as string) || (a.assetType as string) || 'Other',
      currentValue,
      costBasis,
      gainLoss,
      gainLossPercent,
    };
  });
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioId, setPortfolioId] = useState('');
  const [portfolioName, setPortfolioName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'gainLoss' | 'name'>('value');

  // Add Position modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Row action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const portfoliosRes = await portfolioApi.list();
        const portfolios = portfoliosRes.data || [];
        if (portfolios.length > 0) {
          setPortfolioName(portfolios[0].name);
          setPortfolioId(portfolios[0].id);
          const assetsRes = await assetApi.list(portfolios[0].id);
          const assets = Array.isArray(assetsRes.data) ? assetsRes.data : [];
          setHoldings(enrichAssets(assets));
        }
      } catch (err) {
        console.error('Failed to load portfolio:', err);
        setError('Failed to load portfolio. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Close row menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioId) return;

    setFormError('');
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.averageCost);

    if (!form.symbol.trim()) { setFormError('Symbol is required'); return; }
    if (!form.name.trim()) { setFormError('Company / asset name is required'); return; }
    if (!form.category.trim()) { setFormError('Category is required'); return; }
    if (isNaN(qty) || qty <= 0) { setFormError('Quantity must be a positive number'); return; }
    if (isNaN(cost) || cost <= 0) { setFormError('Average cost must be a positive number'); return; }

    setIsSubmitting(true);
    try {
      await assetApi.add(portfolioId, {
        symbol: form.symbol.toUpperCase().trim(),
        name: form.name.trim(),
        assetType: form.assetType,
        category: form.category.trim(),
        quantity: qty,
        averageCost: cost,
      });
      const assetsRes = await assetApi.list(portfolioId);
      const assets = Array.isArray(assetsRes.data) ? assetsRes.data : [];
      setHoldings(enrichAssets(assets));
      setShowAddModal(false);
      setForm(DEFAULT_FORM);
    } catch {
      setFormError('Failed to add position. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveHolding = async (id: string) => {
    setOpenMenuId(null);
    try {
      await assetApi.remove(id);
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // no-op — a toast notification could be added here
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Header title="Portfolio Holdings" subtitle="Manage your investments" />
        <div className="min-h-[40vh] flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <p className="text-accent-danger mb-4">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        </div>
      </>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (holdings.length === 0) {
    return (
      <>
        <Header title="Portfolio Holdings" subtitle="Manage your investments" />
        <div className="min-h-[50vh] flex items-center justify-center">
          <Card className="p-10 text-center max-w-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FolderPlus className="w-8 h-8 text-accent-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Holdings Yet</h2>
            <p className="text-text-secondary mb-6">
              Add your first position to start tracking your portfolio performance.
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              Add Position
            </Button>
          </Card>
        </div>

        {showAddModal && (
          <AddPositionModal
            form={form}
            formError={formError}
            isSubmitting={isSubmitting}
            onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
            onSubmit={handleAddPosition}
            onClose={() => { setShowAddModal(false); setForm(DEFAULT_FORM); setFormError(''); }}
          />
        )}
      </>
    );
  }

  // ── Holdings view ──────────────────────────────────────────────────────────
  const sortedHoldings = [...holdings].sort((a, b) => {
    if (sortBy === 'value') return b.currentValue - a.currentValue;
    if (sortBy === 'gainLoss') return b.gainLoss - a.gainLoss;
    return a.name.localeCompare(b.name);
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return (
    <>
      <Header
        title="Portfolio Holdings"
        subtitle={`${holdings.length} positions${portfolioName ? ` in ${portfolioName}` : ''}`}
        actions={
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Position
          </Button>
        }
      />

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Total Value</div>
          <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Total Cost Basis</div>
          <div className="text-3xl font-bold">{formatCurrency(totalCost)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Total Gain/Loss</div>
          <div className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-success' : 'text-accent-danger'}`}>
            {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Return</div>
          <div className={`text-3xl font-bold ${totalGainLossPercent >= 0 ? 'text-success' : 'text-accent-danger'}`}>
            {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
          </div>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader
          title="All Holdings"
          actions={
            <div className="flex gap-2">
              {(['value', 'gainLoss', 'name'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    sortBy === sort
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'bg-background-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {sort === 'value' ? 'By Value' : sort === 'gainLoss' ? 'By Gain' : 'By Name'}
                </button>
              ))}
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Symbol</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Name</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Category</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Shares</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Avg Cost</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Price</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Value</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Gain/Loss</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-text-muted"></th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding) => (
                <tr key={holding.id || holding.symbol} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono font-semibold">{holding.symbol}</span>
                  </td>
                  <td className="py-4 px-4 text-text-secondary">{holding.name}</td>
                  <td className="py-4 px-4">
                    <Badge variant="neutral">{holding.category}</Badge>
                  </td>
                  <td className="py-4 px-4 text-right font-mono">{holding.shares}</td>
                  <td className="py-4 px-4 text-right font-mono">${holding.avgCost.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right font-mono">${holding.currentPrice.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right font-mono font-semibold">
                    {formatCurrency(holding.currentValue)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {holding.gainLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-accent-danger" />
                      )}
                      <span className={`font-mono font-semibold ${holding.gainLoss >= 0 ? 'text-success' : 'text-accent-danger'}`}>
                        {holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right relative">
                    <button
                      className="p-2 hover:bg-background-primary rounded-lg transition-colors"
                      onClick={() => setOpenMenuId(openMenuId === holding.id ? null : holding.id)}
                    >
                      <MoreVertical className="w-4 h-4 text-text-muted" />
                    </button>
                    {openMenuId === holding.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-4 top-full mt-1 z-10 bg-background-secondary border border-border rounded-lg shadow-card py-1 min-w-[120px]"
                      >
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-accent-danger hover:bg-background-tertiary transition-colors"
                          onClick={() => handleRemoveHolding(holding.id)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <AddPositionModal
          form={form}
          formError={formError}
          isSubmitting={isSubmitting}
          onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
          onSubmit={handleAddPosition}
          onClose={() => { setShowAddModal(false); setForm(DEFAULT_FORM); setFormError(''); }}
        />
      )}
    </>
  );
}

// ── Add Position Modal ─────────────────────────────────────────────────────

interface AddPositionModalProps {
  form: typeof DEFAULT_FORM;
  formError: string;
  isSubmitting: boolean;
  onChange: (field: keyof typeof DEFAULT_FORM, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function AddPositionModal({ form, formError, isSubmitting, onChange, onSubmit, onClose }: AddPositionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background-secondary border border-border rounded-card shadow-card w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Add Position</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Symbol"
              placeholder="e.g. AAPL"
              value={form.symbol}
              onChange={(e) => onChange('symbol', e.target.value.toUpperCase())}
            />
            <Select
              label="Asset Type"
              options={ASSET_TYPE_OPTIONS}
              value={form.assetType}
              onChange={(e) => onChange('assetType', e.target.value)}
            />
          </div>

          <Input
            label="Company / Asset Name"
            placeholder="e.g. Apple Inc."
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />

          <Input
            label="Category"
            placeholder="e.g. Technology, Healthcare"
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity (Shares)"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => onChange('quantity', e.target.value)}
            />
            <Input
              label="Avg Cost per Share"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.averageCost}
              onChange={(e) => onChange('averageCost', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>
              Add Position
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
