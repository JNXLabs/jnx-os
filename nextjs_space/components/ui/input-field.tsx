import React from 'react';
import { cn } from '@/lib/utils';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)]',
            icon ? 'pl-14 pr-6' : 'pl-6 pr-6',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export { InputField };
