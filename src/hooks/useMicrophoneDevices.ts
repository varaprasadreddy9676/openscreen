import { useState, useEffect } from 'react';

export interface MicrophoneDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export function useMicrophoneDevices() {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Request permission first to get actual device labels
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Enumerate devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
            groupId: device.groupId,
          }));

        // Stop the permission stream
        stream.getTracks().forEach(track => track.stop());

        if (mounted) {
          setDevices(audioInputs);

          // If no device is selected yet, select the default one
          if (selectedDeviceId === 'default' && audioInputs.length > 0) {
            setSelectedDeviceId(audioInputs[0].deviceId);
          }

          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to enumerate audio devices';
          setError(errorMessage);
          setIsLoading(false);
          console.error('Error loading microphone devices:', err);
        }
      }
    };

    loadDevices();

    // Listen for device changes (plug/unplug)
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    isLoading,
    error,
  };
}
