/**
 * PHASE 5.4: Select Component
 * Dropdown select with optional label and placeholder
 */

'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string; // Default disabled option text
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, placeholder, value, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-[var(--text-main)] mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          value={value}
          className={cn(
            'form-input cursor-pointer',
            !value && 'text-[#8b949e]', // Gray text when placeholder shown
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
