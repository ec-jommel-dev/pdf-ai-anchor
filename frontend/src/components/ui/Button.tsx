/**
 * PHASE 5.1: Button Component
 * Reusable button with variants: default, primary, danger
 */

'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer transition-colors',
          'border border-[var(--border-default)]',
          // Variant styles
          variant === 'default' && 'bg-[var(--btn-bg)] text-[var(--text-heading)] hover:bg-[var(--btn-hover)]',
          variant === 'primary' && 'bg-[var(--gh-green)] text-white border-transparent hover:bg-[var(--gh-green-hover)]',
          variant === 'danger' && 'bg-[var(--btn-bg)] text-[var(--gh-red)] hover:bg-[var(--btn-hover)]',
          // Disabled state
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
