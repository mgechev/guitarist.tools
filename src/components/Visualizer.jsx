import React, { useEffect, useRef, useState } from 'react';
import styles from './Visualizer.module.css';

const POINTS_PER_RING = 180; // Resolution of the circle
const MAX_RINGS = 40; // Number of history rings
const BASE_RADIUS = 50; // Starting radius in center
const RING_SPACING = 15; // Distance between rings
const PEAK_HEIGHT_MULTIPLIER = 80;

const Visualizer = ({ activePitchData, activeAttackTime }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const pitchDataRef = useRef(null);
  const hasStartedRef = useRef(false);
  const [hasData, setHasData] = useState(false);

  // Keep a reference to the latest pitch data so the animation loop can access it
  useEffect(() => {
    pitchDataRef.current = activePitchData;
    if (activePitchData && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setHasData(true);
    }
  }, [activePitchData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let rings = [];

    // Initialize rings
    for (let i = 0; i < MAX_RINGS; i++) {
      rings.push(new Array(POINTS_PER_RING).fill(0));
    }

    const resize = () => {
      if (containerRef.current) {
        width = containerRef.current.clientWidth;
        height = containerRef.current.clientHeight;
        // Use devicePixelRatio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
    };
    
    resize();
    window.addEventListener('resize', resize);

    const generateCurrentRing = () => {
      const ring = new Array(POINTS_PER_RING).fill(0);
      const data = pitchDataRef.current;
      
      if (data && data.midiNote !== undefined) {
        // Map midi note to an angle (0 to 2 PI)
        // Assume guitar range ~E2 (40) to ~E6 (88)
        const normalizedPitch = Math.max(0, Math.min(1, (data.midiNote - 40) / 48));
        const targetIndex = Math.floor(normalizedPitch * POINTS_PER_RING);
        
        // Create a simulated peak with a bell curve (Gaussian)
        for (let i = 0; i < POINTS_PER_RING; i++) {
          // Calculate shortest distance around the circle
          let dist = Math.abs(i - targetIndex);
          if (dist > POINTS_PER_RING / 2) {
            dist = POINTS_PER_RING - dist;
          }
          
          // Gaussian function for the peak (widened)
          const amplitude = Math.exp(-(dist * dist) / 40);
          
          // Add harmonic peak (e.g., an octave higher)
          const harmonicDist = Math.abs(i - ((targetIndex + POINTS_PER_RING / 4) % POINTS_PER_RING));
          let hDist = harmonicDist > POINTS_PER_RING / 2 ? POINTS_PER_RING - harmonicDist : harmonicDist;
          const harmonicAmplitude = Math.exp(-(hDist * hDist) / 20) * 0.4;

          ring[i] = amplitude + harmonicAmplitude;
        }
      }
      return ring;
    };

    let frameCount = 0;

    const render = () => {
      // Clear canvas with a slightly transparent black to leave subtle trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // Only push a new ring every few frames to create distinct rings
      if (frameCount % 3 === 0) {
        rings.unshift(generateCurrentRing());
        if (rings.length > MAX_RINGS) {
          rings.pop();
        }
      }
      frameCount++;

      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      // Translate to center
      ctx.translate(cx, cy);
      // Apply 3D perspective squash (scale Y by 0.4)
      ctx.scale(1, 0.4);
      // Rotate slowly over time
      ctx.rotate(frameCount * 0.002);

      // Create a conic gradient for the rainbow effect once per frame
      let gradient;
      try {
        if (ctx.createConicGradient) {
          gradient = ctx.createConicGradient(0, 0, 0);
          gradient.addColorStop(0, 'hsl(0, 100%, 60%)');
          gradient.addColorStop(0.16, 'hsl(60, 100%, 60%)');
          gradient.addColorStop(0.33, 'hsl(120, 100%, 60%)');
          gradient.addColorStop(0.5, 'hsl(180, 100%, 60%)');
          gradient.addColorStop(0.66, 'hsl(240, 100%, 60%)');
          gradient.addColorStop(0.83, 'hsl(300, 100%, 60%)');
          gradient.addColorStop(1, 'hsl(360, 100%, 60%)');
        } else {
          gradient = 'hsl(280, 100%, 70%)'; // Fallback
        }
      } catch (e) {
        gradient = 'hsl(280, 100%, 70%)'; // Fallback
      }

      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;

      // Draw rings back-to-front (oldest first)
      for (let r = rings.length - 1; r >= 0; r--) {
        const ring = rings[r];
        const currentRadius = BASE_RADIUS + r * RING_SPACING;
        const alpha = 1 - (r / MAX_RINGS);
        
        // Use global alpha for fading out older rings
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = gradient;
        ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.5})`; // generic glow

        // 1. Draw the continuous ring path
        ctx.beginPath();
        for (let i = 0; i <= POINTS_PER_RING; i++) {
          const idx = i % POINTS_PER_RING;
          const angle = (idx / POINTS_PER_RING) * Math.PI * 2;
          const amplitude = ring[idx];
          
          const radius = currentRadius + amplitude * PEAK_HEIGHT_MULTIPLIER;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // 2. Draw the vertical "fence" drop lines only where there are peaks
        ctx.beginPath();
        let hasPeaks = false;
        for (let i = 0; i < POINTS_PER_RING; i++) {
          const amplitude = ring[i];
          if (amplitude > 0.1 && r < MAX_RINGS - 2) {
            const angle = (i / POINTS_PER_RING) * Math.PI * 2;
            const radius = currentRadius + amplitude * PEAK_HEIGHT_MULTIPLIER;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const baseX = Math.cos(angle) * currentRadius;
            const baseY = Math.sin(angle) * currentRadius;
            
            ctx.moveTo(x, y);
            ctx.lineTo(baseX, baseY);
            hasPeaks = true;
          }
        }
        
        if (hasPeaks) {
          ctx.globalAlpha = alpha * 0.4;
          ctx.shadowBlur = 0; // Turn off shadow for fences to save perf
          ctx.stroke();
          ctx.shadowBlur = 10; // Turn back on
        }
      }
      
      ctx.restore();
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
          Play your guitar to generate visuals...
        </div>
      )}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default Visualizer;
