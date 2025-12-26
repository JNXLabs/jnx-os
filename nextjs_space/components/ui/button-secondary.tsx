import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonSecondaryProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const ButtonSecondary = React.forwardRef<HTMLButtonElement, ButtonSecondaryProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base classes
          'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
          // Secondary styling
          'bg-slate-800/50 text-white border border-slate-700 hover:bg-slate-700/50 hover:border-slate-600',
          // Size
          sizeClasses[size],
          // Custom classes
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ButtonSecondary.displayName = 'ButtonSecondary';

export { ButtonSecondary };
