'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { adminApi } from '@/lib/api-client';
import { RefreshCw, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminFundRequest } from '@/types';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminFundRequestsPage() {
  const [requests, setRequests] = useState<AdminFundRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { statusFilter: filter } : {};
      const response = await adminApi.listFundRequests(params);
      setRequests(response.data.requests || []);
      setTotalCount(response.data.totalCount || 0);
      setPendingCount(response.data.pendingCount || 0);
    } catch (error) {
      console.error('Failed to load fund requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminApi.reviewFundRequest(id, { status, adminNotes: adminNotes || undefined });
      setReviewingId(null);
      setAdminNotes('');
      loadRequests();
    } catch (error) {
      console.error('Failed to review request:', error);
    }
  };

  const filterOptions: { value: FilterStatus; label: string; icon: typeof Clock }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, 'positive' | 'negative' | 'warning' | 'neutral'> = {
      pending: 'warning',
      approved: 'positive',
      rejected: 'negative',
      canceled: 'neutral',
    };
    return map[status] || 'neutral';
  };

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      bank: 'Bank Transfer',
      card: 'Debit Card',
      mobile_money: 'Mobile Money',
    };
    return map[method] || method;
  };

  return (
    <>
      <Header
        title="Fund Requests"
        subtitle={`${pendingCount} pending requests`}
        actions={
          <Button variant="secondary" onClick={loadRequests}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === option.value
                ? 'bg-accent-primary text-background-primary'
                : 'bg-background-secondary text-text-secondary hover:text-text-primary'
            )}
          >
            <option.icon className="w-4 h-4" />
            {option.label}
          </button>
        ))}
      </div>

      {/* Review Modal */}
      {reviewingId && (
        <Card className="mb-6 border-2 border-accent-primary">
          <CardHeader title="Review Fund Request" />
          <div className="space-y-4">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              rows={3}
              className="w-full p-3 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none"
            />
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => handleReview(reviewingId, 'approved')}>
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button variant="danger" onClick={() => handleReview(reviewingId, 'rejected')}>
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
              <Button variant="secondary" onClick={() => { setReviewingId(null); setAdminNotes(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader title="All Fund Requests" actions={<Badge variant="neutral">{totalCount} total</Badge>} />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No fund requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">User</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Notes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{req.userName}</div>
                      <div className="text-xs text-text-muted">{req.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">{formatCurrency(req.amount)}</td>
                    <td className="py-3 px-4 text-sm">{methodLabel(req.method)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusBadge(req.status)}>{req.status.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary max-w-[200px] truncate">
                      {req.userNotes || req.adminNotes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => setReviewingId(req.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
