/**
 * Neural Network Background Animation
 * 
 * Creates an animated neural network visualization behind hero sections.
 * Gives the impression of active AI thinking and processing.
 * 
 * Features:
 * - Animated nodes (neurons) pulsing
 * - Connecting lines (synapses) with gradient flow
 * - Particle system for data transmission effect
 * - Glassmorphism overlay for depth
 * - Smooth animations with GPU acceleration
 */

'use client';

import { useEffect, useRef } from 'react';

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Neural Network Configuration
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    const particles: Array<{
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
      opacity: number;
    }> = [];

    // Create nodes (neurons)
    const nodeCount = 40;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 3 + 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Move nodes
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Update pulse
        node.pulse += node.pulseSpeed;
        const pulseScale = 1 + Math.sin(node.pulse) * 0.3;

        // Draw connections (synapses)
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.3;
            
            // Gradient line for data flow effect
            const gradient = ctx.createLinearGradient(
              node.x,
              node.y,
              otherNode.x,
              otherNode.y
            );
            gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity})`); // cyan-500
            gradient.addColorStop(0.5, `rgba(14, 165, 233, ${opacity})`); // sky-500
            gradient.addColorStop(1, `rgba(37, 99, 235, ${opacity})`); // blue-600

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();

            // Spawn particles (data transmission)
            if (Math.random() < 0.002) {
              particles.push({
                x: node.x,
                y: node.y,
                targetX: otherNode.x,
                targetY: otherNode.y,
                progress: 0,
                speed: 0.01 + Math.random() * 0.02,
                opacity: 0.8,
              });
            }
          }
        });

        // Draw node (neuron)
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * pulseScale * 2
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)'); // cyan-500
        gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)'); // sky-500
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)'); // transparent

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseScale * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = 'rgba(6, 182, 212, 1)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.progress += particle.speed;
        particle.opacity -= 0.005;

        if (particle.progress >= 1 || particle.opacity <= 0) {
          particles.splice(index, 1);
          return;
        }

        particle.x = particle.x + (particle.targetX - particle.x) * particle.progress;
        particle.y = particle.y + (particle.targetY - particle.y) * particle.progress;

        // Draw particle
        ctx.fillStyle = `rgba(6, 182, 212, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Trail effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
      });

      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Canvas for neural network */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
      
      {/* Glassmorphism overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/30 to-slate-950/80 backdrop-blur-[1px]" />
      
      {/* Radial gradient spotlight effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl" />
    </div>
  );
}
