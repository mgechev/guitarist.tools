import React, { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { NOTES } from '../utils/musicLogic';
import styles from './AudioInputTracker.module.css';

const AudioInputTracker = ({ onPitchDetected }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const monitorGainNodeRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(null);

  // Enumerate devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission first
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    getDevices();
  }, []);

  const startTracking = async () => {
    if (!selectedDeviceId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedDeviceId },
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNodeRef.current = analyserNode;

      const monitorGainNode = audioContext.createGain();
      monitorGainNode.gain.value = isMonitoring ? 1 : 0;
      monitorGainNode.connect(audioContext.destination);
      monitorGainNodeRef.current = monitorGainNode;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyserNode);
      sourceNode.connect(monitorGainNode);

      const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
      const input = new Float32Array(detector.inputLength);

      const updatePitch = () => {
        analyserNode.getFloatTimeDomainData(input);

        // Calculate RMS volume to act as a noise gate
        let sumSquares = 0;
        for (let i = 0; i < input.length; i++) {
          sumSquares += input[i] * input[i];
        }
        const rms = Math.sqrt(sumSquares / input.length);

        // Only process pitch if volume is above a threshold (e.g. 0.01)
        if (rms > 0.01) {
          const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);

          // Increased clarity threshold to 0.9 to ensure it's a strong, sustained tonal sound
          if (clarity > 0.9 && pitch > 50 && pitch < 2000) { 
            // Convert frequency to MIDI note number
            // 69 is A4 (440Hz)
            const midiNote = Math.round(69 + 12 * Math.log2(pitch / 440));
            const exactFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
            const cents = 1200 * Math.log2(pitch / exactFreq);
            
            onPitchDetected({ midiNote, frequency: pitch, cents });
          } else {
            onPitchDetected(null);
          }
        } else {
          onPitchDetected(null);
        }
        
        requestRef.current = requestAnimationFrame(updatePitch);
      };

      setIsTracking(true);
      updatePitch();

    } catch (err) {
      console.error('Error starting audio tracking:', err);
    }
  };

  // Update monitor volume smoothly when toggled
  useEffect(() => {
    if (monitorGainNodeRef.current && audioContextRef.current) {
      const time = audioContextRef.current.currentTime;
      monitorGainNodeRef.current.gain.setTargetAtTime(isMonitoring ? 1 : 0, time, 0.05);
    }
  }, [isMonitoring]);

  const stopTracking = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (monitorGainNodeRef.current) {
      monitorGainNodeRef.current.disconnect();
      monitorGainNodeRef.current = null;
    }
    setIsTracking(false);
    onPitchDetected(null);
  };

  return (
    <div className={styles.audioTrackerControls}>
      <select 
        value={selectedDeviceId} 
        onChange={(e) => setSelectedDeviceId(e.target.value)}
        disabled={isTracking}
        className={styles.deviceSelect}
      >
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
          </option>
        ))}
      </select>
      
      {!isTracking ? (
        <button onClick={startTracking} className={`${styles.trackingBtn} ${styles.start}`}>Connect</button>
      ) : (
        <button onClick={stopTracking} className={`${styles.trackingBtn} ${styles.stop}`}>Disconnect</button>
      )}

      <div className="toggle-group horizontal-toggle" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'space-between', padding: '0 5px' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Monitor Audio</span>
        <div className="toggle-container">
          <input 
            type="checkbox" 
            id="monitor-toggle"
            checked={isMonitoring} 
            onChange={(e) => setIsMonitoring(e.target.checked)} 
          />
          <label htmlFor="monitor-toggle" className="toggle-label"></label>
        </div>
      </div>
    </div>
  );
};

export default AudioInputTracker;
