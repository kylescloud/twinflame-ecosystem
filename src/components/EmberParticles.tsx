import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

const EmberParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(document.documentElement);
    resize();

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: -(Math.random() * 1.2 + 0.3),
      opacity: Math.random() * 0.6 + 0.2,
      life: 0,
      maxLife: Math.random() * 400 + 200,
      hue: Math.random() * 30 + 15, // orange range
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn particles
      if (particles.length < 60 && Math.random() < 0.15) {
        particles.push(createParticle());
      }

      particles.forEach((p) => {
        p.x += p.speedX + Math.sin(p.life * 0.01) * 0.3;
        p.y += p.speedY;
        p.life++;

        const lifeRatio = Math.max(0, 1 - p.life / p.maxLife);
        const alpha = p.opacity * lifeRatio;

        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 95%, 55%, ${alpha})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 90%, 45%, ${alpha * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + 10}, 100%, 70%, ${alpha})`;
        ctx.fill();
      });

      particles = particles.filter((p) => p.life < p.maxLife);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default EmberParticles;
