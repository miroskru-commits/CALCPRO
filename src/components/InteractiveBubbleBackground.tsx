import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';

interface Bubble {
  id: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  size: number; // px
  speedX: number;
  speedY: number;
  hue: number;
  opacity: number;
  isPopping: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const InteractiveBubbleBackground: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [popCount, setPopCount] = useState<number>(0);
  const nextId = useRef<number>(1);
  const particleId = useRef<number>(1);

  // Initialize atmospheric floating bubbles
  useEffect(() => {
    const initialBubbles: Bubble[] = [];
    const count = 18; // optimal density

    for (let i = 0; i < count; i++) {
      // Pick positions biased towards edges and corners (outer 25% horizontally or vertically)
      let x = Math.random() * 100;
      let y = Math.random() * 100;

      // Keep them gently distributed across margins
      initialBubbles.push({
        id: nextId.current++,
        x,
        y,
        size: 32 + Math.random() * 48, // 32px to 80px
        speedX: (Math.random() - 0.5) * 0.04,
        speedY: -0.03 - Math.random() * 0.05, // gentle upward drift
        hue: Math.floor(Math.random() * 80) + 180, // Cyan, Sky, Blue, Indigo, Purple spectrum
        opacity: 0.45 + Math.random() * 0.4,
        isPopping: false,
      });
    }
    setBubbles(initialBubbles);
  }, []);

  // Animation Loop for subtle floating movement and particle physics
  useEffect(() => {
    let animFrame: number;

    const updatePhysics = () => {
      // Update bubbles
      setBubbles((prevBubbles) =>
        prevBubbles.map((b) => {
          if (b.isPopping) return b;

          let newX = b.x + b.speedX;
          let newY = b.y + b.speedY;

          // Wrap or bounce around viewport edges
          if (newY < -10) newY = 105;
          if (newX < -5) newX = 105;
          if (newX > 105) newX = -5;

          return {
            ...b,
            x: newX,
            y: newY,
          };
        })
      );

      // Update explosion particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            alpha: p.alpha - 0.035,
          }))
          .filter((p) => p.alpha > 0)
      );

      animFrame = requestAnimationFrame(updatePhysics);
    };

    animFrame = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Handle Bubble Pop
  const handlePop = (e: React.MouseEvent, bubble: Bubble) => {
    e.stopPropagation();
    sound.playPop();
    setPopCount((c) => c + 1);

    // Spawn splash particle effect
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const newParticles: Particle[] = [];
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: particleId.current++,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: `hsl(${bubble.hue}, 90%, 65%)`,
        size: 3 + Math.random() * 4,
        alpha: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);

    // Mark popping & replace after short delay
    setBubbles((prev) =>
      prev.map((b) => (b.id === bubble.id ? { ...b, isPopping: true } : b))
    );

    setTimeout(() => {
      setBubbles((prev) =>
        prev.map((b) => {
          if (b.id === bubble.id) {
            return {
              id: nextId.current++,
              x: Math.random() * 100,
              y: 102 + Math.random() * 10,
              size: 32 + Math.random() * 48,
              speedX: (Math.random() - 0.5) * 0.04,
              speedY: -0.03 - Math.random() * 0.05,
              hue: Math.floor(Math.random() * 80) + 180,
              opacity: 0.45 + Math.random() * 0.4,
              isPopping: false,
            };
          }
          return b;
        })
      );
    }, 200);
  };

  return (
    <>
      {/* Super gradient atmospheric backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {/* Dynamic mesh gradient spots */}
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-600/20 via-indigo-600/15 to-transparent blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-purple-600/20 via-fuchsia-600/15 to-transparent blur-[140px]" />
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-cyan-600/20 via-blue-600/15 to-transparent blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
      </div>

      {/* Floating Interactive Bubbles Layer (Clickable / Poppable in free space) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-auto">
        {bubbles.map((b) => {
          if (b.isPopping) return null;
          return (
            <button
              key={b.id}
              onClick={(e) => handlePop(e, b)}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                opacity: b.opacity,
                boxShadow: `inset 0 0 15px rgba(255,255,255,0.4), 0 0 20px hsla(${b.hue}, 80%, 60%, 0.35)`,
                borderColor: `hsla(${b.hue}, 90%, 75%, 0.6)`,
              }}
              className="absolute rounded-full border border-white/40 backdrop-blur-[1px] bg-gradient-to-tr from-white/10 via-transparent to-white/20 cursor-pointer hover:scale-125 transition-transform duration-150 active:scale-90 select-none group"
              title="Поп! Лопайте пузырик 🫧"
            >
              {/* Highlight gleam */}
              <span className="absolute top-1.5 left-2 w-2.5 h-1.5 rounded-full bg-white/70 rotate-[-30deg]" />
              <span className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-white/40" />
            </button>
          );
        })}

        {/* Render Splash Particles on Screen */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
            }}
            className="fixed rounded-full pointer-events-none shadow-sm -translate-x-1/2 -translate-y-1/2"
          />
        ))}

        {/* Small floating counter in corner when popped */}
        {popCount > 0 && (
          <div className="fixed bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-sky-400 font-mono flex items-center gap-1 backdrop-blur-md shadow-lg pointer-events-none select-none z-10">
            <span>🫧</span>
            <span>Попнуто: {popCount}</span>
          </div>
        )}
      </div>
    </>
  );
};
