import React, { useState, useEffect } from 'react';
import { generateId } from '@/utils/helpers';

const COLORS = ['#39d353', '#58a6ff', '#bc8cff', '#e3b341', '#f85149', '#d29922'];
const SHAPES = ['rounded-full', 'rounded-sm', ''];

interface Particle {
  id: string;
  left: string;
  width: number;
  height: number;
  color: string;
  shape: string;
  duration: string;
  delay: string;
}

const Confetti = ({ active }: { active: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const allParticles: Particle[] = [];
    for (let wave = 0; wave < 3; wave++) {
      for (let i = 0; i < 33; i++) {
        allParticles.push({
          id: generateId() + i + wave,
          left: `${Math.random() * 100}vw`,
          width: 6 + Math.random() * 8,
          height: 6 + Math.random() * 10,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          duration: `${2 + Math.random() * 2}s`,
          delay: `${wave * 0.1 + Math.random() * 1.5}s`,
        });
      }
    }
    setParticles(allParticles);
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute ${p.shape}`}
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            '--duration': p.duration,
            '--delay': p.delay,
            animation: `confettiFall var(--duration) linear var(--delay) forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default Confetti;
