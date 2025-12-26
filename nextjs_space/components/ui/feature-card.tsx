import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  children,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group relative p-8 bg-slate-900/40 border border-slate-800/60 rounded-xl transition-all duration-300 hover:bg-slate-900/60',
        className
      )}
    >
      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-500" />
      
      {icon && <div className="mb-4 text-cyan-500">{icon}</div>}
      
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
      
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
