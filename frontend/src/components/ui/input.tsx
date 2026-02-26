import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'px-4 py-3 bg-background-tertiary border border-border rounded-btn text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors',
            error && 'border-accent-danger focus:border-accent-danger',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-accent-danger">{error}</span>
        )}
        {helperText && !error && (
          <span className="text-xs text-text-muted">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
