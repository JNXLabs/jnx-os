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
      ? 'shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.7)]'
      : '';

    return (
      <button
        ref={ref}
        className={cn(
          // Base classes
          'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
          // Primary gradient
          'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 border-0',
          // Size
          sizeClasses[size],
          // Glow effect
          glowClasses,
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

ButtonPrimary.displayName = 'ButtonPrimary';

export { ButtonPrimary };
