import { useState, useEffect, useRef } from 'react';

export interface AudioLevelMeterOptions {
  enabled: boolean;
  deviceId?: string;
  smoothingFactor?: number; // 0-1, higher = smoother but less responsive
}

export function useAudioLevelMeter(options: AudioLevelMeterOptions) {
  const [level, setLevel] = useState(0); // 0-100
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!options.enabled) {
      // Clean up if disabled
      cleanup();
      setLevel(0);
      return;
    }

    let mounted = true;

    const startMonitoring = async () => {
      try {
        // Get microphone stream
        const constraints: MediaStreamConstraints = {
          audio: options.deviceId
            ? { deviceId: { exact: options.deviceId } }
            : true,
          video: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        // Create audio context and analyser
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = options.smoothingFactor || 0.8;
        analyserRef.current = analyser;

        // Connect stream to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Start monitoring levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!mounted || !analyserRef.current) return;

          analyser.getByteFrequencyData(dataArray);

          // Calculate RMS (Root Mean Square) for more accurate level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);

          // Normalize to 0-100 (255 is max byte value)
          const normalizedLevel = Math.min(100, (rms / 255) * 100 * 2); // *2 to boost sensitivity

          setLevel(normalizedLevel);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.error('Error starting audio level monitoring:', err);
        if (mounted) {
          setLevel(0);
        }
      }
    };

    startMonitoring();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [options.enabled, options.deviceId, options.smoothingFactor]);

  const cleanup = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  return { level };
}
