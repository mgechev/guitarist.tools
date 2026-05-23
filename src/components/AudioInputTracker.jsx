import { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { getSharedAudioContext } from '../utils/audioContext';
import Toggle from './shared/Toggle';
import styles from './AudioInputTracker.module.css';

const AudioInputTracker = ({ onPitchDetected, onConnectionChange, onAttackDetected, onAudioData, visible = false }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [noiseGate, setNoiseGate] = useState(0.02);
  
  const audioContextRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const monitorGainNodeRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(null);

  const noiseGateRef = useRef(noiseGate);
  useEffect(() => {
    noiseGateRef.current = noiseGate;
  }, [noiseGate]);

  const prevRmsRef = useRef(0);
  
  const startTracking = async (overrideDeviceId, overrideDeviceLabel) => {
    let deviceId = (overrideDeviceId && typeof overrideDeviceId === 'string') ? overrideDeviceId : selectedDeviceId;
    
    // iOS Safari requires AudioContext to be resumed synchronously inside a user gesture.
    // We must do this before awaiting the media stream!
    const audioContext = getSharedAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    audioContextRef.current = audioContext;

    try {
      let stream;
      if (!deviceId) {
        // Request default audio input if no deviceId is selected/provided
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false
          }
        });
        
        // Populate the device list now that permission is granted
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        
        // Resolve the active device ID
        const audioTracks = stream.getAudioTracks();
        let activeDeviceId = '';
        if (audioTracks.length > 0) {
          const settings = audioTracks[0].getSettings();
          activeDeviceId = settings.deviceId || audioInputs[0]?.deviceId || '';
          if (activeDeviceId) {
            deviceId = activeDeviceId;
            setSelectedDeviceId(activeDeviceId);
            const label = settings.label || audioInputs.find(d => d.deviceId === activeDeviceId)?.label;
            if (label) {
              localStorage.setItem('fretmaster_device_label', label);
            }
          }
        }
        
        if (!deviceId && audioInputs.length > 0) {
          deviceId = audioInputs[0].deviceId;
          setSelectedDeviceId(deviceId);
        }
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: deviceId },
              echoCancellation: false,
              autoGainControl: false,
              noiseSuppression: false
            }
          });
        } catch (exactErr) {
          console.warn("FretMaster exact device constraint failed, falling back to ideal:", exactErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { ideal: deviceId },
              echoCancellation: false,
              autoGainControl: false,
              noiseSuppression: false
            }
          });
        }
      }

      if (!stream) {
        throw new Error('Failed to acquire stream');
      }

      streamRef.current = stream;

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
      const freqData = new Uint8Array(analyserNode.frequencyBinCount);
      let lastAttackTime = 0;

      const updatePitch = () => {
        analyserNode.getFloatTimeDomainData(input);
        analyserNode.getByteFrequencyData(freqData);

        if (onAudioData) {
          // Pass a copy so it doesn't get mutated before React renders it
          onAudioData(new Uint8Array(freqData));
        }

        // Calculate RMS volume to act as a noise gate
        let sumSquares = 0;
        for (let i = 0; i < input.length; i++) {
          sumSquares += input[i] * input[i];
        }
        const rms = Math.sqrt(sumSquares / input.length);

        if (rms > noiseGateRef.current) {
          // Attack detection logic: sharp volume spike
          if (rms > prevRmsRef.current * 1.5 && rms > noiseGateRef.current + 0.01) {
            const now = audioContext.currentTime;
            if (now - lastAttackTime > 0.035) { // 35ms debounce for high-speed picking
              lastAttackTime = now;
              if (onAttackDetected) {
                onAttackDetected(now);
              }
            }
          }

          const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);

          // Lowered clarity threshold to 0.75 so chords (which have lower monophonic clarity) register a dominant note
          if (clarity > 0.75 && pitch > 50 && pitch < 2000) { 
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
        
        prevRmsRef.current = rms;
        
        requestRef.current = requestAnimationFrame(updatePitch);
      };

      setIsTracking(true);
      if (onConnectionChange) onConnectionChange(true);
      localStorage.setItem('fretmaster_auto_connect', 'true');
      
      const finalId = deviceId || localStorage.getItem('fretmaster_device_id');
      if (finalId) {
        localStorage.setItem('fretmaster_device_id', finalId);
        const label = overrideDeviceLabel || devices.find(d => d.deviceId === finalId)?.label;
        if (label) {
          localStorage.setItem('fretmaster_device_label', label);
        }
      }
      
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
    // Do not close shared audio context
    if (monitorGainNodeRef.current) {
      monitorGainNodeRef.current.disconnect();
      monitorGainNodeRef.current = null;
    }
    setIsTracking(false);
    if (onConnectionChange) onConnectionChange(false);
    localStorage.setItem('fretmaster_auto_connect', 'false');
    onPitchDetected(null);
  };

  // Enumerate devices on mount and auto-connect
  useEffect(() => {
    const resumeOnInteraction = () => {
      const audioContext = audioContextRef.current || getSharedAudioContext();
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log("FretMaster AudioContext successfully resumed via user interaction.");
        }).catch(err => {
          console.error("FretMaster failed to resume AudioContext on interaction:", err);
        });
      }
      // Remove after first interaction
      window.removeEventListener('click', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
    };

    window.addEventListener('click', resumeOnInteraction);
    window.addEventListener('keydown', resumeOnInteraction);
    window.addEventListener('touchstart', resumeOnInteraction);

    const getDevices = async () => {
      try {
        const autoConnect = localStorage.getItem('fretmaster_auto_connect') === 'true';
        const hasPreviousConnection = !!(localStorage.getItem('fretmaster_device_id') || localStorage.getItem('fretmaster_device_label'));
        
        let shouldRequestPermission = false;
        
        if (autoConnect) {
          shouldRequestPermission = true;
        } else if (hasPreviousConnection) {
          // If they connected in the past, verify if permission is already granted so we don't trigger a popup
          if (navigator.permissions && navigator.permissions.query) {
            try {
              const status = await navigator.permissions.query({ name: 'microphone' });
              if (status.state === 'granted') {
                shouldRequestPermission = true;
              }
            } catch {
              // Ignore and fallback
            }
          }
        }

        if (shouldRequestPermission) {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach(track => track.stop()); // Stop the temp stream immediately to release the mic
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        
        if (audioInputs.length > 0) {
          const storedDeviceId = localStorage.getItem('fretmaster_device_id');
          const storedDeviceLabel = localStorage.getItem('fretmaster_device_label');

          let matchedDevice = audioInputs.find(d => d.deviceId === storedDeviceId);
          if (!matchedDevice && storedDeviceLabel) {
            const getCleanLabel = (str) => {
              return str.replace(/default\s*-\s*/gi, '')
                        .replace(/default/gi, '')
                        .trim()
                        .toLowerCase();
            };

            const cleanStored = getCleanLabel(storedDeviceLabel);
            if (cleanStored) {
              matchedDevice = audioInputs.find(d => getCleanLabel(d.label) === cleanStored);
              if (!matchedDevice) {
                matchedDevice = audioInputs.find(d => {
                  const cleanLabel = getCleanLabel(d.label);
                  return cleanLabel && (cleanLabel.includes(cleanStored) || cleanStored.includes(cleanLabel));
                });
              }
            }
          }

          const targetDevice = matchedDevice || audioInputs[0];
          if (targetDevice.deviceId) {
            setSelectedDeviceId(targetDevice.deviceId);
          }

          if (autoConnect && targetDevice.deviceId) {
            startTracking(targetDevice.deviceId, targetDevice.label);
          }
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    getDevices();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('click', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      // Do not close the shared audio context
      if (monitorGainNodeRef.current) monitorGainNodeRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPermission = devices.length > 0 && devices.some(d => d.label);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.audioTrackerControls}>
      <select 
        value={selectedDeviceId} 
        onChange={(e) => setSelectedDeviceId(e.target.value)}
        disabled={isTracking}
        className={styles.deviceSelect}
      >
        {!hasPermission ? (
          <option value="">Default Microphone</option>
        ) : (
          devices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
            </option>
          ))
        )}
      </select>
      
      {!isTracking ? (
        <button onClick={startTracking} className={`${styles.trackingBtn} ${styles.start}`}>Connect</button>
      ) : (
        <button onClick={stopTracking} className={`${styles.trackingBtn} ${styles.stop}`}>Disconnect</button>
      )}

      <div style={{ marginTop: '0.75rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Monitor Audio</span>
          <Toggle 
            id="monitor-toggle"
            checked={isMonitoring}
            onChange={setIsMonitoring}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Noise Gate</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>{Math.round(noiseGate * 1000)}</span>
          </div>
          <input 
            type="range" 
            min="0.001" 
            max="0.1" 
            step="0.001" 
            value={noiseGate} 
            onChange={(e) => setNoiseGate(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--text-primary)' }}
            title="Increase this if background noise/hum is registering as played notes."
          />
        </div>
      </div>
    </div>
  );
};

export default AudioInputTracker;
