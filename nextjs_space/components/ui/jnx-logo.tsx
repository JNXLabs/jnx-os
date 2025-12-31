'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface JNXLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'admin';
}

export function JNXLogo({ 
  className, 
  animated = true, 
  size = 'md',
  variant = 'default'
}: JNXLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Colors based on variant
  const colors = {
    default: {
      primary: '#06b6d4', // cyan-500
      secondary: '#3b82f6', // blue-500
      accent: '#22d3ee' // cyan-400
    },
    admin: {
      primary: '#a855f7', // purple-500
      secondary: '#ec4899', // pink-500
      accent: '#c084fc' // purple-400
    }
  };

  const color = colors[variant];

  const Container = animated ? motion.svg : 'svg';

  return (
    <Container
      viewBox="0 0 100 100"
      className={cn(
        sizeClasses[size],
        'relative',
        className
      )}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={animated ? { duration: 0.5, ease: 'easeOut' } : undefined}
    >
      <defs>
        {/* Gradient for X shape */}
        <linearGradient id={`xGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.primary} stopOpacity="0.9" />
          <stop offset="50%" stopColor={color.accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color.secondary} stopOpacity="1" />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Left part of X */}
      <path
        d="M 20 20 L 40 50 L 20 80"
        stroke={`url(#xGradient-${variant})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#glow-${variant})`}
      />

      {/* Test tube in center */}
      <g>
        {/* Tube body */}
        <rect
          x="42"
          y="30"
          width="16"
          height="40"
          rx="2"
          fill="none"
          stroke={color.primary}
          strokeWidth="2"
          opacity="0.8"
        />
        
        {/* Tube cap */}
        <rect
          x="40"
          y="28"
          width="20"
          height="4"
          rx="1"
          fill={color.accent}
          opacity="0.6"
        />
        
        {/* Liquid/Bubbles inside tube */}
        <circle cx="50" cy="55" r="2" fill={color.primary} opacity="0.4" />
        <circle cx="48" cy="60" r="1.5" fill={color.accent} opacity="0.5" />
        <circle cx="52" cy="62" r="1.5" fill={color.secondary} opacity="0.4" />
        
        {/* Bubbles rising (animated if enabled) */}
        {animated ? (
          <>
            <motion.circle
              cx="50"
              cy="65"
              r="1"
              fill={color.primary}
              opacity="0.6"
              animate={{
                cy: [65, 35],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <motion.circle
              cx="48"
              cy="68"
              r="1.2"
              fill={color.accent}
              opacity="0.5"
              animate={{
                cy: [68, 32],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5
              }}
            />
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="1" fill={color.primary} opacity="0.3" />
            <circle cx="48" cy="45" r="1.2" fill={color.accent} opacity="0.25" />
          </>
        )}
      </g>

      {/* Right part of X with circuit lines */}
      <g>
        {/* Main right stroke of X */}
        <path
          d="M 60 20 L 40 50 L 60 80"
          stroke={`url(#xGradient-${variant})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#glow-${variant})`}
        />
        
        {/* Circuit lines */}
        <path
          d="M 65 30 L 75 30 M 73 28 L 73 32"
          stroke={color.accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 65 50 L 78 50 M 76 48 L 76 52 M 76 52 L 78 52"
          stroke={color.primary}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 65 70 L 72 70 M 72 68 L 74 70 L 72 72"
          stroke={color.secondary}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        {/* Circuit nodes */}
        <circle cx="75" cy="30" r="1.5" fill={color.accent} opacity="0.8" />
        <circle cx="78" cy="50" r="1.5" fill={color.primary} opacity="0.7" />
        <circle cx="72" cy="70" r="1.5" fill={color.secondary} opacity="0.8" />
      </g>

      {/* Floating particles around */}
      {animated && (
        <>
          <motion.circle
            cx="30"
            cy="25"
            r="1"
            fill={color.accent}
            opacity="0.4"
            animate={{
              y: [-2, 2],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.circle
            cx="70"
            cy="85"
            r="1.5"
            fill={color.primary}
            opacity="0.3"
            animate={{
              y: [2, -2],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1
            }}
          />
        </>
      )}
    </Container>
  );
}