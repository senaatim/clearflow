'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { authApi, handleApiError } from '@/lib/api-client';

const SPECIAL_CHARS = /[!@#$%^&*()\-_=+\[\]{}|;':",./<>?\\`~]/;

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .regex(/^[A-Za-z\s'\-]+$/, "First name may only contain letters, spaces, hyphens, or apostrophes"),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(/^[A-Za-z\s'\-]+$/, "Last name may only contain letters, spaces, hyphens, or apostrophes"),
    email: z.string().email('Please enter a valid email'),
    nin: z
      .string()
      .regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
    bvn: z
      .string()
      .regex(/^\d{11}$/, 'BVN must be exactly 11 digits'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(SPECIAL_CHARS, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service and Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const riskToleranceOptions = [
  { value: 'conservative', label: 'Conservative - Low risk, steady returns' },
  { value: 'moderate', label: 'Moderate - Balanced risk and reward' },
  { value: 'aggressive', label: 'Aggressive - Higher risk, higher potential' },
];

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'Uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number (0–9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (!@#$…)', test: (p: string) => SPECIAL_CHARS.test(p) },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      riskTolerance: 'moderate',
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        nin: data.nin,
        bvn: data.bvn,
      });

      setSubmitted(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center font-mono font-bold text-2xl text-background-primary">
            CF
          </div>
          <span className="text-2xl font-bold tracking-tight">ClearFlow</span>
        </div>
        <Card className="p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold">Registration Submitted</h2>
          <p className="text-text-secondary text-sm">
            Your account is under review. Our team will verify your details and grant you access shortly.
          </p>
          <p className="text-xs text-text-muted">
            You can try signing in once your account has been approved.
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 text-sm text-accent-primary hover:underline"
          >
            Go to Sign In
          </Link>
        </Card>
        <p className="text-center text-xs text-text-muted">A subsidiary of Jbryanson Globals Limited</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-text-secondary">Start your investment journey today</p>
      </div>

      {/* Register Form */}
      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          {/* KYC fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="NIN"
              placeholder="11-digit NIN"
              maxLength={11}
              error={errors.nin?.message}
              {...register('nin')}
            />
            <Input
              label="BVN"
              placeholder="11-digit BVN"
              maxLength={11}
              error={errors.bvn?.message}
              {...register('bvn')}
            />
          </div>
          <p className="text-xs text-text-muted -mt-3">
            Your NIN and BVN are encrypted and used only for identity verification.
          </p>

          {/* Password field */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-muted hover:text-text-secondary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password requirements checklist */}
            {passwordValue.length > 0 && (
              <ul className="grid grid-cols-1 gap-1 p-3 rounded-lg bg-background-tertiary border border-border text-xs">
                {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
                  const met = test(passwordValue);
                  return (
                    <li key={label} className={`flex items-center gap-2 ${met ? 'text-success' : 'text-text-muted'}`}>
                      {met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                      {label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Confirm password field */}
          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-text-muted hover:text-text-secondary"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <Select
            label="Risk Tolerance"
            options={riskToleranceOptions}
            error={errors.riskTolerance?.message}
            {...register('riskTolerance')}
          />

          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="acceptTerms"
                className="w-4 h-4 mt-0.5 rounded border-border bg-background-tertiary accent-accent-primary"
                {...register('acceptTerms')}
              />
              <label htmlFor="acceptTerms" className="text-sm text-text-secondary">
                I agree to the{' '}
                <Link href="/terms" className="text-accent-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-accent-danger ml-6">{errors.acceptTerms.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      {/* Sign in link */}
      <p className="text-center text-text-secondary text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-accent-primary hover:underline">
          Sign in
        </Link>
      </p>

      {/* Branding */}
      <p className="text-center text-xs text-text-muted">
        A subsidiary of Jbryanson Globals Limited
      </p>
    </div>
  );
}
