'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { authApi, handleApiError } from '@/lib/api-client';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-background-primary">
            CF
          </div>
          <span className="text-2xl font-bold tracking-tight">ClearFlow</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
        <p className="text-text-secondary">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <Card className="p-8">
        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-text-secondary text-sm">
              If that email is registered, you'll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 text-sm text-accent-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-text-secondary text-sm">
        Remember your password?{' '}
        <Link href="/login" className="text-accent-primary hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-text-muted">
        A subsidiary of Jbryanson Globals Limited
      </p>
    </div>
  );
}
