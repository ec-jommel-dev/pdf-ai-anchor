/**
 * PHASE 5.2: Badge Component
 * Status indicator for Active/Archived states
 */

'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'active' | 'inactive' | 'default';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold border',
        variant === 'active' && 'text-[var(--gh-green)] border-[var(--gh-green)]',
        variant === 'inactive' && 'text-[var(--gh-red)] border-[var(--gh-red)]',
        variant === 'default' && 'text-[var(--text-main)] border-[var(--border-default)]',
        className
      )}
    >
      {children}
    </span>
  );
}
