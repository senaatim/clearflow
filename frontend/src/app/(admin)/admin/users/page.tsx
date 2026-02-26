'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api-client';
import { Search, RefreshCw } from 'lucide-react';
import type { AdminUser } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await adminApi.listUsers(params);
      setUsers(response.data.users || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await adminApi.updateUser(userId, { isActive: !currentActive });
      loadUsers(search || undefined);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      loadUsers(search || undefined);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'negative' as const;
    if (role === 'broker') return 'warning' as const;
    return 'neutral' as const;
  };

  return (
    <>
      <Header
        title="User Management"
        subtitle={`${totalCount} total users`}
        actions={
          <Button variant="secondary" onClick={() => loadUsers(search || undefined)}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {/* Search */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>
          <Button variant="primary" type="submit">Search</Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader title="All Users" actions={<Badge variant="neutral">{totalCount} users</Badge>} />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Last Login</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{user.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-background-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary"
                      >
                        <option value="user">User</option>
                        <option value="broker">Broker</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.isActive ? 'positive' : 'negative'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          user.isActive
                            ? 'text-accent-danger bg-accent-danger/10 hover:bg-accent-danger/20'
                            : 'text-success bg-success/10 hover:bg-success/20'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
