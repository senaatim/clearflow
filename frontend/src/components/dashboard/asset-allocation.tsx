'use client';

import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { portfolioApi } from '@/lib/api-client';
import type { AllocationData } from '@/types';

const COLORS = ['#00ffaa', '#00d4ff', '#00ff88', '#ffbb00', '#ff6b9d', '#a78bfa', '#f97316'];

interface AssetAllocationProps {
  portfolioId?: string;
}

export function AssetAllocation({ portfolioId }: AssetAllocationProps) {
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!portfolioId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await portfolioApi.getAllocation(portfolioId);
        const data = Array.isArray(res.data) ? res.data : [];
        // Assign colors if not present
        const colored = data.map((item: AllocationData, i: number) => ({
          ...item,
          color: item.color || COLORS[i % COLORS.length],
        }));
        setAllocationData(colored);
      } catch {
        setAllocationData([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [portfolioId]);

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
      <CardHeader
        title="Asset Allocation"
        actions={
          <button className="icon-btn">
            <Info className="w-4 h-4 text-text-secondary" />
          </button>
        }
      />
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allocationData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-text-muted text-sm">
          No assets in this portfolio yet
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allocationData.map((item) => (
            <div key={item.name} className="allocation-item">
              <div
                className="w-3 h-12 rounded-md"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1">{item.name}</div>
                <div className="text-xs text-text-muted">{item.type}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono mb-1">
                  {item.percentage}%
                </div>
                <div className="text-xs text-text-secondary">
                  {formatCurrency(item.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
