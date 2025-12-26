import React from 'react';
import { cn } from '@/lib/utils';

interface TerminalBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalBox({ title, children, className }: TerminalBoxProps) {
  return (
    <div
      className={cn(
        'bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 font-mono text-sm',
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-slate-400 ml-2">{title}</span>
        </div>
      )}
      <div className="text-slate-300">{children}</div>
    </div>
  );
}
