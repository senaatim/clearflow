'use client';

import { useState } from 'react';
import { User, Bell, Shield, Palette } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  return (
    <>
      <Header
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Tabs - Horizontal on mobile, vertical on desktop */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="p-2">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full',
                      activeTab === tab.id
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                    )}
                  >
                    <Icon className="w-4 lg:w-5 h-4 lg:h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader title="Profile Information" />
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-xl sm:text-2xl font-bold text-background-primary">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-text-secondary text-sm">{user?.email}</p>
                    <button className="mt-2 text-sm text-accent-primary hover:underline">
                      Change avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input label="First Name" defaultValue={user?.firstName} />
                  <Input label="Last Name" defaultValue={user?.lastName} />
                </div>

                <Input label="Email" type="email" defaultValue={user?.email} />
                <Input label="Phone" type="tel" placeholder="+1 (555) 123-4567" />

                <Select
                  label="Risk Tolerance"
                  options={[
                    { value: 'conservative', label: 'Conservative - Low risk' },
                    { value: 'moderate', label: 'Moderate - Balanced' },
                    { value: 'aggressive', label: 'Aggressive - High risk' },
                  ]}
                  defaultValue={user?.riskTolerance}
                />

                <Button variant="primary">Save Changes</Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" />
              <div className="space-y-4 md:space-y-6">
                {[
                  { id: 'email_digest', label: 'Email Digest', description: 'Weekly portfolio summary' },
                  { id: 'price_alerts', label: 'Price Alerts', description: 'Significant price changes' },
                  { id: 'rebalance', label: 'Rebalancing Alerts', description: 'Portfolio needs rebalancing' },
                  { id: 'recommendations', label: 'AI Recommendations', description: 'New investment recommendations' },
                  { id: 'tax', label: 'Tax Opportunities', description: 'Tax-loss harvesting opportunities' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 md:p-4 bg-background-tertiary rounded-xl">
                    <div className="min-w-0 flex-1 mr-4">
                      <div className="font-medium text-sm md:text-base">{item.label}</div>
                      <div className="text-xs md:text-sm text-text-secondary truncate">{item.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-background-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                ))}

                <Select
                  label="Email Frequency"
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'none', label: 'None' },
                  ]}
                  defaultValue="weekly"
                />

                <Button variant="primary">Save Preferences</Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader title="Security Settings" />
              <div className="space-y-6">
                <div className="p-4 bg-background-tertiary rounded-xl">
                  <h4 className="font-semibold mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <Input label="Current Password" type="password" />
                    <Input label="New Password" type="password" />
                    <Input label="Confirm New Password" type="password" />
                    <Button variant="secondary">Update Password</Button>
                  </div>
                </div>

                <div className="p-4 bg-background-tertiary rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-4">
                      <h4 className="font-semibold">Two-Factor Authentication</h4>
                      <p className="text-sm text-text-secondary">Add extra security</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-background-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader title="Display Preferences" />
              <div className="space-y-6">
                <Select
                  label="Theme"
                  options={[
                    { value: 'dark', label: 'Dark Mode' },
                    { value: 'light', label: 'Light Mode' },
                    { value: 'system', label: 'System Default' },
                  ]}
                  defaultValue="dark"
                />

                <Select
                  label="Currency"
                  options={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'NGN', label: 'NGN' },
                  ]}
                  defaultValue="USD"
                />

                <Select
                  label="Timezone"
                  options={[
                    { value: 'Africa/Lagos', label: 'West Africa Time' },
                    { value: 'America/New_York', label: 'Eastern Time' },
                    { value: 'Europe/London', label: 'GMT' },
                  ]}
                  defaultValue="Africa/Lagos"
                />

                <Button variant="primary">Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
