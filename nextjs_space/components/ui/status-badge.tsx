import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'degraded' | 'online' | 'coming-soon';
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusColors = {
    connected: 'bg-green-500/10 text-green-400 border-green-500/30',
    online: 'bg-green-500/10 text-green-400 border-green-500/30',
    disconnected: 'bg-red-500/10 text-red-400 border-red-500/30',
    degraded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    'coming-soon': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border',
        statusColors[status],
        className
      )}
    >
      {children}
    </span>
  );
}
