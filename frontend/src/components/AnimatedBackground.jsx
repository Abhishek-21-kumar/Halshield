/**
 * HalShield — Animated Background Component.
 * Creates floating particles and mesh gradient for a futuristic AI feel.
 */
import { useEffect, useRef } from 'react';

export default function AnimatedBackground({ variant = 'full' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const count = variant === 'full' ? 60 : 30;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '124,92,252' : '6,182,212',
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,92,252,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity * 0.15})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Mesh gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full blur-[120px] animate-float"
          style={{
            width: 400, height: 400,
            top: '10%', left: '15%',
            background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full blur-[120px] animate-float"
          style={{
            width: 350, height: 350,
            bottom: '15%', right: '10%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
            animationDelay: '1.5s',
          }}
        />
        <div
          className="absolute rounded-full blur-[100px] animate-float"
          style={{
            width: 250, height: 250,
            top: '50%', right: '30%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
            animationDelay: '3s',
          }}
        />
      </div>
    </>
  );
}
