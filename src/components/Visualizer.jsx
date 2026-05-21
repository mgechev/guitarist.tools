import { useEffect, useRef, useState } from 'react';
import { NOTES } from '../utils/musicLogic';
import styles from './Visualizer.module.css';

const NUM_PARTICLES = 80;

const createParticle = (baseDistance) => {
  const angle = Math.random() * Math.PI * 2;
  const radialDistance = baseDistance + Math.random() * 90;
  return {
    angle,
    radialDistance,
    baseRadius: radialDistance,
    x: 0,
    y: 0,
    size: 1.2 + Math.random() * 2.5,
    speed: 0.003 + Math.random() * 0.008,
    opacity: 0.3 + Math.random() * 0.5,
    // Complementary colors: violet/magenta or teal/cyan
    hue: Math.random() > 0.5 ? 270 + Math.random() * 50 : 170 + Math.random() * 50,
    state: 'orbit',
    vx: 0,
    vy: 0,
    life: 1.0,
    decay: 0.01 + Math.random() * 0.015
  };
};

const Visualizer = ({ activePitchData, activeAttackTime, activeAudioData }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  const audioDataRef = useRef(null);
  const pitchDataRef = useRef(null);
  const shockwaveTriggerRef = useRef(false);
  const hasStartedRef = useRef(false);
  const [hasData, setHasData] = useState(false);

  // Sync incoming props to refs to avoid effect re-binding
  useEffect(() => {
    if (activeAttackTime) {
      shockwaveTriggerRef.current = true;
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        setTimeout(() => setHasData(true), 0);
      }
    }
  }, [activeAttackTime]);

  useEffect(() => {
    audioDataRef.current = activeAudioData;
    pitchDataRef.current = activePitchData;
    if (activeAudioData && !hasStartedRef.current) {
      const hasSound = activeAudioData.some(val => val > 10);
      if (hasSound) {
        hasStartedRef.current = true;
        setTimeout(() => setHasData(true), 0);
      }
    }
  }, [activeAudioData, activePitchData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      if (containerRef.current) {
        width = containerRef.current.clientWidth;
        height = containerRef.current.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const baseDistance = Math.min(width, height) * 0.16;
    const particles = Array.from({ length: NUM_PARTICLES }, () => createParticle(baseDistance));

    // Smoothly interpolated values to prevent visual pops
    let smoothedRms = 0;

    const drawWarpedRing = (cx, cy, baseRadius, data, minIndex, maxIndex, color1, color2, rms) => {
      ctx.beginPath();
      const numPoints = 100;
      const points = [];
      const dataLen = maxIndex - minIndex;
      
      for (let i = 0; i < numPoints; i++) {
        // Sample corresponding FFT bins
        const sampleIdx = minIndex + Math.floor((i % (numPoints / 2)) / (numPoints / 2) * dataLen);
        const val = data ? (data[sampleIdx] || 0) : 0;
        const normalized = val / 255;
        
        // Dynamic radial warp based on frequency magnitude
        const warpAmount = Math.pow(normalized, 1.3) * 75 * (0.3 + rms * 0.7);
        const r = baseRadius + warpAmount;
        
        const angle = (i / numPoints) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        points.push({ x, y });
      }
      
      // Connect points smoothly via quadratic midpoints
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < numPoints; i++) {
        const next = points[(i + 1) % numPoints];
        const xc = (points[i].x + next.x) / 2;
        const yc = (points[i].y + next.y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.closePath();
      
      const grad = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, baseRadius * 1.8);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.5 + rms * 4;
      ctx.shadowBlur = 8 + rms * 12;
      ctx.shadowColor = color1;
      ctx.stroke();
    };

    const render = () => {
      // Clear canvas cleanly
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, width, height);

      const data = audioDataRef.current;
      const pitchInfo = pitchDataRef.current;
      
      // Detect theme dynamically for contrast settings
      const isLightMode = document.documentElement.classList.contains('light-mode');

      // Calculate relative RMS amplitude from the audio spectral data
      let sumSquares = 0;
      if (data) {
        const checkLen = Math.min(data.length, 300);
        for (let i = 0; i < checkLen; i++) {
          const val = data[i] / 255;
          sumSquares += val * val;
        }
      }
      const targetRms = Math.sqrt(sumSquares / 300);
      smoothedRms = smoothedRms * 0.85 + targetRms * 0.15;

      const cx = width / 2;
      const cy = height / 2;
      
      // Dynamic center orb radius
      const baseRadius = Math.min(width, height) * 0.15;
      const orbRadius = baseRadius * (1.0 + smoothedRms * 0.4);

      // Handle attack trigger for particles
      let isShockwave = false;
      if (shockwaveTriggerRef.current) {
        isShockwave = true;
        shockwaveTriggerRef.current = false;
      }

      // 1. Draw central glowing orb
      const orbGrad = ctx.createRadialGradient(cx, cy, orbRadius * 0.1, cx, cy, orbRadius);
      if (isLightMode) {
        orbGrad.addColorStop(0, 'rgba(124, 58, 237, 0.12)'); // Violet soft
        orbGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.06)'); // Pink soft
        orbGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        orbGrad.addColorStop(0, 'rgba(139, 92, 246, 0.28)'); // Violet glow
        orbGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.12)'); // Rose glow
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw warped circular rings (bass & treble)
      // Inner Ring (Bass/Mid, bins 5 to 60)
      const colorInner = isLightMode ? 'rgba(219, 39, 119, 0.85)' : '#ec4899'; // Deep pink
      const colorInnerGrad = isLightMode ? 'rgba(79, 70, 229, 0.4)' : 'rgba(99, 102, 241, 0.2)'; // Indigo
      drawWarpedRing(cx, cy, baseRadius, data, 5, 60, colorInner, colorInnerGrad, smoothedRms);

      // Outer Ring (Treble, bins 60 to 180)
      const colorOuter = isLightMode ? 'rgba(13, 148, 136, 0.85)' : '#14b8a6'; // Teal
      const colorOuterGrad = isLightMode ? 'rgba(30, 41, 59, 0.1)' : 'rgba(255, 255, 255, 0.05)';
      drawWarpedRing(cx, cy, baseRadius * 1.35, data, 60, 180, colorOuter, colorOuterGrad, smoothedRms);

      // 3. Update & Draw orbital particle vortex
      particles.forEach(p => {
        if (isShockwave) {
          p.state = 'explode';
          const speed = 4 + Math.random() * 8;
          p.vx = Math.cos(p.angle) * speed;
          p.vy = Math.sin(p.angle) * speed;
          p.life = 1.0;
          p.opacity = 0.95;
        }

        if (p.state === 'explode') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.life -= p.decay;
          p.opacity = p.life * 0.95;

          if (p.life <= 0) {
            p.state = 'orbit';
            p.angle = Math.random() * Math.PI * 2;
            p.radialDistance = p.baseRadius;
            p.opacity = 0.2 + Math.random() * 0.6;
          }
        } else {
          p.angle += p.speed * (1.0 + smoothedRms * 3.5);
          const currentDistance = p.radialDistance + smoothedRms * 40 * Math.sin(p.angle * 2.5);
          p.x = Math.cos(p.angle) * currentDistance;
          p.y = Math.sin(p.angle) * currentDistance;
        }

        ctx.fillStyle = `hsla(${p.hue}, 100%, ${isLightMode ? '45%' : '65%'}, ${p.opacity})`;
        ctx.shadowBlur = isLightMode ? 2 : 6;
        ctx.shadowColor = `hsl(${p.hue}, 100%, ${isLightMode ? '45%' : '65%'})`;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw central note display text
      if (pitchInfo) {
        const noteName = NOTES[pitchInfo.midiNote % 12];
        ctx.shadowBlur = isLightMode ? 3 : 15;
        ctx.shadowColor = isLightMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
        ctx.fillStyle = isLightMode ? '#111827' : '#ffffff';
        ctx.font = '900 48px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteName, cx, cy);
      } else {
        // Draw elegant idle pulse center
        ctx.fillStyle = isLightMode ? 'rgba(17, 24, 39, 0.3)' : 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, 5 + Math.sin(Date.now() / 250) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className={styles.visualizerContainer} ref={containerRef}>
      {!hasData && (
        <div className={styles.emptyState}>
          Connect and play your guitar to generate visuals...
        </div>
      )}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default Visualizer;
