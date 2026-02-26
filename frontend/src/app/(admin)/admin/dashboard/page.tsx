'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { adminApi } from '@/lib/api-client';
import {
  Users,
  DollarSign,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import type { AdminStats, AdminFundRequest, AdminTrade } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<AdminFundRequest[]>([]);
  const [recentTrades, setRecentTrades] = useState<AdminTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, depositsRes, tradesRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.listFundRequests({ statusFilter: 'pending', limit: 5 }),
          adminApi.listTrades({ statusFilter: 'pending', limit: 5 }),
        ]);
        setStats(statsRes.data);
        setRecentDeposits(depositsRes.data.requests || []);
        setRecentTrades(tradesRes.data.trades || []);
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Admin Dashboard"
        subtitle="Overview of platform activity"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers?.toString() || '0'}
          icon={<Users className="w-5 h-5" />}
          subtitle={`${stats?.activeUsers || 0} active`}
        />
        <StatCard
          title="Pending Deposits"
          value={stats?.pendingDeposits?.toString() || '0'}
          icon={<DollarSign className="w-5 h-5" />}
          variant="warning"
          subtitle={`${stats?.totalDepositsToday || 0} today`}
        />
        <StatCard
          title="Pending Trades"
          value={stats?.pendingTrades?.toString() || '0'}
          icon={<Briefcase className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          title="Total AUM"
          value={formatCurrency(stats?.totalAum || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="positive"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Deposits */}
        <Card>
          <CardHeader
            title="Pending Deposit Requests"
            actions={
              <Link href="/admin/fund-requests" className="flex items-center gap-1 text-sm text-accent-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
          {recentDeposits.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-sm">
              No pending deposit requests
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between p-3 bg-background-tertiary rounded-xl">
                  <div>
                    <div className="font-medium text-sm">{deposit.userName}</div>
                    <div className="text-xs text-text-muted">{deposit.userEmail}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-sm">{formatCurrency(deposit.amount)}</div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      {new Date(deposit.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Trades */}
        <Card>
          <CardHeader
            title="Pending Trade Requests"
            actions={
              <Link href="/admin/trades" className="flex items-center gap-1 text-sm text-accent-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
          {recentTrades.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-sm">
              No pending trade requests
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-background-tertiary rounded-xl">
                  <div>
                    <div className="font-medium text-sm">{trade.userName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={trade.action === 'buy' ? 'positive' : 'negative'}>
                        {trade.action.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-xs">{trade.symbol}</span>
                      <span className="text-xs text-text-muted">x{trade.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {trade.estimatedTotal && (
                      <div className="font-mono font-semibold text-sm">{formatCurrency(trade.estimatedTotal)}</div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
