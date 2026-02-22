import React, { useEffect, useRef } from 'react';
import { Sounds } from '@/utils/soundEngine';

interface LandingPageProps {
  onStartCrafting: () => void;
  onJoinProject: () => void;
}

const floatingEmojis = [
  { emoji: '⛏️', className: 'top-[15%] left-[10%]', delay: '0s' },
  { emoji: '💎', className: 'top-[12%] right-[12%]', delay: '1s' },
  { emoji: '🪨', className: 'bottom-[20%] left-[8%]', delay: '2s' },
  { emoji: '🌲', className: 'bottom-[18%] right-[10%]', delay: '0.5s' },
  { emoji: '🔥', className: 'top-[40%] right-[6%]', delay: '1.5s' },
];

const features = [
  { emoji: '🗂️', title: 'TRACK DEPS', subtitle: 'Know exactly what your team needs and who has it' },
  { emoji: '👥', title: 'COLLABORATE', subtitle: 'Real-time team coordination with invite codes' },
  { emoji: '⚠️', title: 'SPOT BLOCKS', subtitle: "Instantly see what's slowing your project down" },
];

const LandingPage = ({ onStartCrafting, onJoinProject }: LandingPageProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ac: AudioContext | null = null;
    const getAC = () => {
      if (!ac) ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      return ac;
    };

    const scheduleSound = (now: number) => {
      const a = getAC();
      const osc = a.createOscillator();
      const gain = a.createGain();
      const filt = a.createBiquadFilter();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(420, now);
      gain.gain.setValueAtTime(1.2, now); // Increased significantly to 1.2
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(filt); filt.connect(gain); gain.connect(a.destination);
      osc.start(now); osc.stop(now + 0.15);

      const len = Math.floor(a.sampleRate * 0.06);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
      const src = a.createBufferSource(); src.buffer = buf;
      const ng = a.createGain();
      ng.gain.setValueAtTime(0.8, now); // Increased significantly to 0.8
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      const nf = a.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 300; nf.Q.value = 0.8;
      src.connect(nf); nf.connect(ng); ng.connect(a.destination);
      src.start(now); src.stop(now + 0.07);
    };

    const playBlock = () => {
      const a = getAC();
      if (a.state === 'suspended') {
        a.resume().then(() => scheduleSound(a.currentTime)).catch(() => { });
      } else {
        scheduleSound(a.currentTime);
      }
    };

    let audioUnlocked = false;
    const unlockAudio = () => {
      if (audioUnlocked) return;
      audioUnlocked = true;
      const a = getAC();
      if (a.state === 'suspended') a.resume().then(() => { });
    };
    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev =>
      document.addEventListener(ev, unlockAudio, { once: false })
    );

    const spawnBlockAtSpan = (span: HTMLSpanElement) => {
      if (!span || !overlayRef.current) return;
      const rect = span.getBoundingClientRect();
      if (rect.width === 0) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const block = document.createElement('div');
      block.className = 'block-visual';
      block.style.left = centerX + 'px';
      block.style.top = centerY + 'px';
      const rot = (Math.random() * 30 - 15).toFixed(1);
      block.style.transform = `translate(-50%, -50%) scale(0.2) rotate(${rot}deg)`;
      overlayRef.current.appendChild(block);
      setTimeout(() => { if (block.parentNode) block.remove(); }, 300);
    };

    const WORD = 'CRAFTCHAIN';
    const DELAY = 50; // Minimal delay for immediate start
    const SPEED = 160; // Slightly faster for snappier feel

    let started = false;
    const startAnimation = () => {
      if (started || !titleRef.current) return;
      started = true;
      unlockAudio();

      titleRef.current.innerHTML = '';
      WORD.split('').forEach(ch => {
        const sp = document.createElement('span');
        sp.className = 'lt font-pixel';
        sp.textContent = ch;
        titleRef.current!.appendChild(sp);
      });

      const spans = titleRef.current.querySelectorAll('.lt');
      const timeouts: any[] = [];
      const revealLetter = (i: number) => {
        if (i >= spans.length) {
          timeouts.push(setTimeout(() => {
            if (curRef.current) curRef.current.classList.add('hide');
          }, 280));
          return;
        }

        // Ensure sound and visual happen in the same tick if possible
        playBlock();
        spans[i].classList.add('on');
        spawnBlockAtSpan(spans[i] as HTMLSpanElement);

        const nextDelay = i === 0 ? DELAY : SPEED;
        timeouts.push(setTimeout(() => revealLetter(i + 1), nextDelay));
      };

      // Start immediately
      revealLetter(0);

      return () => timeouts.forEach(clearTimeout);
    };

    const overlay = document.getElementById('audio-unlock-overlay');
    const handleStart = () => {
      if (overlay) overlay.style.display = 'none';
      startAnimation();
    };

    if (overlay) {
      overlay.addEventListener('click', handleStart);
    } else {
      // Fallback if overlay is missing
      startAnimation();
    }

    return () => {
      if (overlay) overlay.removeEventListener('click', handleStart);
      ['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev =>
        document.removeEventListener(ev, unlockAudio)
      );
    };
  }, []);

  useEffect(() => {
    // 3D Canvas
    const cv = document.getElementById('bg') as HTMLCanvasElement;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let W = innerWidth, H = innerHeight, mx = 0, my = 0;
    const rez = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
    rez();
    window.addEventListener('resize', rez);

    const onMouseMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    // 3-D math helpers
    const rX = (pts: any[], a: number) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y, z]) => [x, y * c - z * s, y * s + z * c]); };
    const rY = (pts: any[], a: number) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y, z]) => [x * c + z * s, y, -x * s + z * c]); };
    const rZ = (pts: any[], a: number) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y, z]) => [x * c - y * s, x * s + y * c, z]); };
    const pr = (x: number, y: number, z: number, fov = 420) => { const d = z + fov; return d > 0 ? { x: W / 2 + x * (fov / d), y: H / 2 + y * (fov / d) } : null; };

    const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const verts = (s: number) => { const h = s / 2; return [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]]; };

    // Lists
    const CUBES = Array.from({ length: 20 }, () => ({
      x: (Math.random() - .5) * innerWidth * 2, y: (Math.random() - .5) * innerHeight * 2, z: Math.random() * 700 + 100,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, vz: (Math.random() - .5) * .18,
      sz: Math.random() * 55 + 18, a: Math.random() * .27 + .04,
      rx: Math.random() * Math.PI * 2, ry: Math.random() * Math.PI * 2, rz: Math.random() * Math.PI * 2,
      drx: (Math.random() - .5) * .009, dry: (Math.random() - .5) * .009, drz: (Math.random() - .5) * .005
    }));
    const PARTS = Array.from({ length: 130 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - .5) * .38, vy: (Math.random() - .5) * .38,
      r: Math.random() * 1.8 + .4, a: Math.random() * .45 + .08
    }));
    const SYM = ['⛏', '◆', '▲', '✦', '⬡', '⬟', '●'];
    const FLOAT = Array.from({ length: 10 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
      sym: SYM[~~(Math.random() * SYM.length)], sz: Math.random() * 20 + 10, a: Math.random() * .09 + .025,
      rot: Math.random() * Math.PI * 2, dr: (Math.random() - .5) * .009
    }));
    const RINGS = Array.from({ length: 5 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 180 + 70, a: Math.random() * .055 + .015, ph: Math.random() * Math.PI * 2, sp: Math.random() * .004 + .001
    }));

    let reqId: number;
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      RINGS.forEach(r => {
        r.ph += r.sp; const p = (Math.sin(r.ph) + 1) / 2;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,136,${r.a * p})`; ctx.lineWidth = .5; ctx.stroke();
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r * .55, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,136,${r.a * p * .45})`; ctx.stroke();
      });
      PARTS.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,136,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < PARTS.length; i++) {
        for (let j = i + 1; j < PARTS.length; j++) {
          const dx = PARTS[i].x - PARTS[j].x, dy = PARTS[i].y - PARTS[j].y, d = Math.hypot(dx, dy);
          if (d < 95) {
            ctx.beginPath(); ctx.moveTo(PARTS[i].x, PARTS[i].y); ctx.lineTo(PARTS[j].x, PARTS[j].y);
            ctx.strokeStyle = `rgba(0,255,136,${.055 * (1 - d / 95)})`; ctx.lineWidth = .35; ctx.stroke();
          }
        }
      }
      CUBES.forEach(c => {
        c.x += c.vx; c.y += c.vy; c.z += c.vz; c.rx += c.drx; c.ry += c.dry; c.rz += c.drz;
        if (c.x < -W) c.x = W; if (c.x > W) c.x = -W;
        if (c.y < -H) c.y = H; if (c.y > H) c.y = -H;
        if (c.z < 50) c.z = 750; if (c.z > 800) c.z = 80;

        let pts = verts(c.sz);
        const mdx = (mx - W / 2) * .00018, mdy = (my - H / 2) * .00018;
        pts = rX(pts, c.rx + mdy); pts = rY(pts, c.ry + mdx); pts = rZ(pts, c.rz);
        const pj = pts.map(([x, y, z]) => pr(x + c.x - W / 2, y + c.y - H / 2, z));
        if (!pj.some(p => !p)) {
          ctx.strokeStyle = `rgba(0,255,136,${c.a})`; ctx.lineWidth = .65;
          ctx.shadowBlur = 7; ctx.shadowColor = `rgba(0,255,136,${c.a * .9})`;
          EDGES.forEach(([a, b]) => {
            if (pj[a] && pj[b]) { ctx.beginPath(); ctx.moveTo(pj[a]!.x, pj[a]!.y); ctx.lineTo(pj[b]!.x, pj[b]!.y); ctx.stroke(); }
          });
          ctx.shadowBlur = 0;
        }
      });
      FLOAT.forEach(f => {
        f.x += f.vx; f.y += f.vy; f.rot += f.dr;
        if (f.x < -60) f.x = W + 60; if (f.x > W + 60) f.x = -60;
        if (f.y < -60) f.y = H + 60; if (f.y > H + 60) f.y = -60;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.font = `${f.sz}px serif`; ctx.fillStyle = `rgba(0,255,136,${f.a})`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(f.sym, 0, 0); ctx.restore();
      });
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 220);
      g.addColorStop(0, 'rgba(0,255,136,.045)'); g.addColorStop(1, 'rgba(0,255,136,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      reqId = requestAnimationFrame(frame);
    };
    reqId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', rez);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-void overflow-hidden px-4">
      {/* Background UI effects */}
      <div className="grain"></div>
      <canvas id="bg" className="absolute inset-0 w-full h-full z-0 opacity-40"></canvas>
      <div className="grid-overlay"></div>
      <div className="scan"></div>
      <div className="vig"></div>

      {/* Block effect overlay */}
      <div id="block-overlay" ref={overlayRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}></div>

      {floatingEmojis.map((item, i) => (
        <span
          key={i}
          className={`absolute text-3xl animate-float select-none ${item.className}`}
          style={{ animationDelay: item.delay, zIndex: 5 }}
        >
          {item.emoji}
        </span>
      ))}

      <div className="text-center z-10 w-full max-w-4xl pt-8">

        <div id="audio-unlock-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-md cursor-pointer group">
          <div className="text-center group-hover:scale-105 transition-transform duration-500">
            <div className="text-6xl mb-6 animate-bounce">⛏️</div>
            <div className="text-craft-green font-pixel text-2xl tracking-[0.3em] mb-2 shadow-glow-green">CRAFTCHAIN</div>
            <div className="text-muted-foreground font-pixel text-xs tracking-widest animate-pulse">CLICK ANYWHERE TO START WITH SOUND</div>
          </div>
        </div>

        <div className="title-wrap" style={{ minHeight: '120px' }}>
          <div className="halo"></div>
          <h1 id="title" ref={titleRef} className="font-pixel text-4xl sm:text-6xl text-craft-green flex justify-center items-center m-0 leading-none tracking-[4px] sm:tracking-[8px]">
            {/* Letters populated by useEffect */}
          </h1>
          <span id="tcur" ref={curRef} className="font-pixel text-4xl sm:text-6xl text-craft-green leading-none">|</span>
          <div className="shimmer-sweep"></div>
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground tracking-widest mt-6">
          PLAN. COLLABORATE. CRAFT SMARTER.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center">
          <button
            onClick={() => { Sounds.navigate(); onStartCrafting(); }}
            className="bg-craft-green text-primary-foreground font-bold text-xs px-8 py-4 rounded-lg hover:shadow-glow-green hover:scale-105 active:scale-95 transition-all duration-200"
          >
            ⛏ START CRAFTING
          </button>
          <button
            onClick={() => { Sounds.navigate(); onJoinProject(); }}
            className="border-2 border-craft-green text-craft-green text-xs px-8 py-4 rounded-lg bg-transparent hover:bg-green-dim hover:text-green-300 active:scale-95 transition-all duration-200"
          >
            JOIN A PROJECT
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mt-20 max-w-3xl">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-elevated border border-border rounded-xl p-6 feature-box animate-slide-up flex-1"
              style={{ animationDelay: `${(i + 1) * 0.1}s` }}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <div className="text-xs text-craft-green mb-2">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.subtitle}</div>
            </div>
          ))}
        </div>


      </div>

      <footer className="fixed bottom-4 text-xs text-muted-foreground text-center w-full z-10">
        © 2025 CraftChain · Noobathon VI · Web Development Track 2
      </footer>
    </div>
  );
};

export default LandingPage;

