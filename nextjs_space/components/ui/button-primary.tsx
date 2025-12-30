import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonPrimaryProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  children: React.ReactNode;
}

const ButtonPrimary = React.forwardRef<HTMLButtonElement, ButtonPrimaryProps>(
  ({ className, size = 'md', glow = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    const glowClasses = glow
      ? 'shadow-glow-primary hover:shadow-glow-hover'
      : '';

    return (
      <button
        ref={ref}
        className={cn(
          // Base classes
          'relative inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-300 overflow-hidden group',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500',
          // Primary gradient
          'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
          'hover:from-cyan-400 hover:to-blue-500 hover:scale-105',
          'active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          'border-0',
          // Size
          sizeClasses[size],
          // Glow effect
          glowClasses,
          // Custom classes
          className
        )}
        {...props}
      >
        {/* Shimmer effect on hover */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

ButtonPrimary.displayName = 'ButtonPrimary';

export { ButtonPrimary };
