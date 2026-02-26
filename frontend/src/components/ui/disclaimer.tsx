'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Shield } from 'lucide-react';
import { DISCLAIMERS } from '@/lib/subscription';

type DisclaimerType = 'general' | 'noGuarantee' | 'recommendation' | 'broker' | 'ai';
type DisclaimerVariant = 'inline' | 'banner' | 'compact' | 'footer';

interface DisclaimerProps {
  type?: DisclaimerType | DisclaimerType[];
  variant?: DisclaimerVariant;
  className?: string;
  showIcon?: boolean;
}

export function Disclaimer({
  type = 'general',
  variant = 'inline',
  className,
  showIcon = true,
}: DisclaimerProps) {
  const types = Array.isArray(type) ? type : [type];
  const texts = types.map((t) => DISCLAIMERS[t]).filter(Boolean);

  if (texts.length === 0) return null;

  const Icon = variant === 'banner' ? AlertTriangle : Info;

  if (variant === 'compact') {
    return (
      <p className={cn('text-xs text-text-muted', className)}>
        {texts.join(' ')}
      </p>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={cn('border-t border-border pt-4 mt-4', className)}>
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {texts.map((text, index) => (
              <p key={index} className="text-xs text-text-muted">
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'bg-warning/10 border border-warning/20 rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {showIcon && (
            <Icon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            {texts.map((text, index) => (
              <p key={index} className="text-sm text-text-primary">
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn('flex items-start gap-2', className)}>
      {showIcon && (
        <Info className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
      )}
      <p className="text-xs text-text-muted">{texts.join(' ')}</p>
    </div>
  );
}

export function RiskWarning({ className }: { className?: string }) {
  return (
    <Disclaimer
      type={['general', 'noGuarantee']}
      variant="banner"
      className={className}
    />
  );
}

export function InvestmentDisclaimer({ className }: { className?: string }) {
  return (
    <Disclaimer
      type={['recommendation', 'ai']}
      variant="footer"
      className={className}
    />
  );
}

export function BrokerDisclaimer({ className }: { className?: string }) {
  return (
    <Disclaimer
      type="broker"
      variant="inline"
      className={className}
    />
  );
}
