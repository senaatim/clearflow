'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { authApi, handleApiError } from '@/lib/api-client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    setIsPending(false);

    try {
      const response = await authApi.login(data);
      const { user, accessToken, refreshToken } = response.data;

      login(user, accessToken, refreshToken);

      // Wait for zustand persist to write to localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Role-based redirect
      if (user.role === 'broker' || user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = handleApiError(err);
      if (msg.toLowerCase().includes('pending review')) {
        setIsPending(true);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-background-primary">
            CF
          </div>
          <span className="text-2xl font-bold tracking-tight">ClearFlow</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-text-secondary">Sign in to your investment dashboard</p>
      </div>

      {/* Login Form */}
      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isPending && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm space-y-1">
              <p className="font-semibold">Account Under Review</p>
              <p className="text-text-secondary text-xs">
                Your registration is being reviewed by our team. You will receive access once an admin approves your account.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border bg-background-tertiary accent-accent-primary"
              />
              <span className="text-text-secondary">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-accent-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      {/* Sign up link */}
      <p className="text-center text-text-secondary text-sm">
        Don't have an account?{' '}
        <Link href="/register" className="text-accent-primary hover:underline">
          Create one
        </Link>
      </p>

      {/* Branding */}
      <p className="text-center text-xs text-text-muted">
        A subsidiary of Jbryanson Globals Limited
      </p>
    </div>
  );
}
