import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_SYMBOL = '₦';

export function formatCurrency(
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en-NG'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatNumber(
  value: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;

  return formatDate(date);
}

export function calculateChange(
  current: number,
  previous: number
): { amount: number; percentage: number } {
  const amount = current - previous;
  const percentage = previous !== 0 ? (amount / previous) * 100 : 0;
  return { amount, percentage };
}

export function getRiskColor(score: number): string {
  if (score <= 3) return 'text-success';
  if (score <= 6) return 'text-warning';
  return 'text-accent-danger';
}

export function getRiskLabel(score: number): string {
  if (score <= 3) return 'Low Risk';
  if (score <= 6) return 'Moderate';
  return 'High Risk';
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-accent-danger';
  return 'text-text-secondary';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Color palette for charts
export const chartColors = {
  primary: '#00ffaa',
  secondary: '#00d4ff',
  success: '#00ff88',
  warning: '#ffbb00',
  danger: '#ff4466',
  purple: '#a855f7',
  pink: '#ff6b9d',
  orange: '#ff9f43',
};

export const allocationColors = [
  '#00ffaa', // Technology
  '#00d4ff', // Healthcare
  '#00ff88', // Real Estate
  '#ffbb00', // Bonds
  '#ff6b9d', // International
  '#a855f7', // Commodities
  '#ff9f43', // Cash
];

// Delay utility for animations
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
