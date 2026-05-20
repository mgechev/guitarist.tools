import { useEffect, useRef, useState } from 'react';
import styles from './Visualizer.module.css';

const BAR_WIDTH = 6;
const GAP = 2;
const DOT_RADIUS = 2;
const DOT_SPACING = 8; // Vertical space between dots

const Visualizer = ({ activeAttackTime, activeAudioData }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const audioDataRef = useRef(null);
  const hasStartedRef = useRef(false);
  const shockwaveTriggerRef = useRef(false);
  const [hasData, setHasData] = useState(false);

  // Trigger shockwave on attacks (chords/strums)
  useEffect(() => {
    if (activeAttackTime) {
      shockwaveTriggerRef.current = true;
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        setTimeout(() => setHasData(true), 0);
      }
    }
  }, [activeAttackTime]);

  // Keep a reference to the latest audio data so the animation loop can access it
  useEffect(() => {
    audioDataRef.current = activeAudioData;
    if (activeAudioData && !hasStartedRef.current) {
      // Check if there is actual sound (not just pure silence array of 0s)
      const hasSound = activeAudioData.some(val => val > 10);
      if (hasSound) {
        hasStartedRef.current = true;
        setTimeout(() => setHasData(true), 0);
      }
    }
  }, [activeAudioData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;

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

    // Keep an array of smoothed bar values to allow smooth decay
    let barHeights = [];

    const render = () => {
      // Clear canvas completely to allow CSS light/dark mode background to show through.
      // Reset shadow blur to 0 before clearing to prevent previous frame's shadow from bleeding into the clear.
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, width, height);

      const data = audioDataRef.current;
      
      // Calculate how many bars fit horizontally
      const numBars = Math.max(10, Math.floor(width / (BAR_WIDTH + GAP)));
      
      // Initialize or resize smoothed array
      if (barHeights.length !== numBars) {
        barHeights = new Array(numBars).fill(0);
      }

      let isShockwave = false;
      if (shockwaveTriggerRef.current) {
        isShockwave = true;
        shockwaveTriggerRef.current = false;
      }

      // Calculate target heights
      const targetHeights = new Array(numBars).fill(0);
      
      if (isShockwave) {
        for (let i = 0; i < numBars; i++) {
          targetHeights[i] = 0.5 + Math.random() * 0.5; 
        }
      } else if (data) {
        // Map FFT bins to bars. Use first ~300 bins for relevant guitar frequencies.
        const binsToUse = Math.min(300, data.length);
        const binsPerBar = binsToUse / numBars;
        
        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          const startIndex = Math.floor(i * binsPerBar);
          const endIndex = Math.floor((i + 1) * binsPerBar);
          
          for (let j = startIndex; j < endIndex; j++) {
            sum += data[j];
          }
          const avg = sum / (endIndex - startIndex || 1);
          
          // Scale and add dynamic curve
          const normalized = avg / 255;
          targetHeights[i] = Math.pow(normalized, 1.5) * 1.5;
        }
      }

      // Smooth decay logic
      for (let i = 0; i < numBars; i++) {
        if (targetHeights[i] > barHeights[i]) {
          // Fast attack
          barHeights[i] = targetHeights[i];
        } else {
          // Smooth decay
          barHeights[i] -= 0.03;
          if (barHeights[i] < 0) barHeights[i] = 0;
        }
      }

      const cy = height / 2;
      const maxPossibleHeight = height / 2.5;

      // Draw the linear dotted bars
      for (let i = 0; i < numBars; i++) {
        // Center the entire block of bars horizontally
        const totalBarsWidth = numBars * (BAR_WIDTH + GAP);
        const xOffset = (width - totalBarsWidth) / 2;
        const x = xOffset + i * (BAR_WIDTH + GAP) + (BAR_WIDTH / 2);
        
        const amplitude = barHeights[i];
        
        // Ensure at least 1 dot for idle state
        let numDots = Math.max(1, Math.floor((amplitude * maxPossibleHeight) / DOT_SPACING));
        
        // Map color ratio: 0 to 1 across the width
        const ratio = i / numBars;
        
        // From left to right: Blue (240) -> Purple/Pink (300) -> Red (0) -> Yellow (60) -> Green (120)
        // Total hue range covered: 240 degrees (240 + 240 = 480. 480 % 360 = 120)
        const hue = (240 + ratio * 240) % 360;
        
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;

        for (let j = 0; j < numDots; j++) {
          const yDist = j * DOT_SPACING;
          
          // Draw top dot
          ctx.beginPath();
          ctx.arc(x, cy - yDist, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          // Draw bottom dot (skip drawing the exact center dot twice)
          if (j > 0) {
            ctx.beginPath();
            ctx.arc(x, cy + yDist, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
          }
        }
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
