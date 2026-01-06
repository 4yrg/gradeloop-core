/**
 * useAudioCapture Hook
 * Captures audio from microphone for viva voice streaming
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface AudioCaptureOptions {
  /** Audio sample rate (default: 16000 for ASR) */
  sampleRate?: number;
  /** Chunk interval in ms (default: 250ms) */
  chunkInterval?: number;
  /** Called for each audio chunk */
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  /** Called when recording starts */
  onStart?: () => void;
  /** Called when recording stops */
  onStop?: (audioBlob: Blob) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface AudioCaptureState {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  audioLevel: number;
  error: string | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioCapture(options: AudioCaptureOptions = {}) {
  const {
    sampleRate = 16000,
    chunkInterval = 250,
    onAudioChunk,
    onStart,
    onStop,
    onError,
  } = options;

  // State
  const [state, setState] = useState<AudioCaptureState>({
    isRecording: false,
    isSupported: typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    hasPermission: null,
    audioLevel: 0,
    error: null,
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Audio recording not supported' }));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
        }
      });
      
      // Permission granted, stop the test stream
      stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: 'Microphone permission denied' 
      }));
      return false;
    }
  }, [state.isSupported, sampleRate]);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    if (state.isRecording) {
      console.warn('Already recording');
      return;
    }

    if (!state.isSupported) {
      const error = new Error('Audio recording not supported');
      onError?.(error);
      return;
    }

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate,
        },
      });
      streamRef.current = stream;

      // Setup audio analysis for level monitoring
      setupAudioAnalysis(stream);

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous chunks
      chunksRef.current = [];

      // Handle data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // Send chunk to callback if provided
          if (onAudioChunk) {
            event.data.arrayBuffer().then(buffer => {
              onAudioChunk(buffer);
            });
          }
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        onStop?.(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError?.(new Error('Recording error'));
      };

      // Start recording with timeslice for chunks
      mediaRecorder.start(chunkInterval);
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        hasPermission: true,
        error: null 
      }));
      
      onStart?.();
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      setState(prev => ({ ...prev, error: err.message }));
      onError?.(err);
    }
  }, [state.isRecording, state.isSupported, sampleRate, chunkInterval, onAudioChunk, onStart, onStop, onError]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (!state.isRecording) return;

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Cleanup audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setState(prev => ({ ...prev, isRecording: false, audioLevel: 0 }));
    console.log('Recording stopped');
  }, [state.isRecording]);

  /**
   * Setup audio analysis for level monitoring
   */
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Update audio level
      const updateLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        const level = Math.min(average / 128, 1); // Normalize to 0-1

        setState(prev => ({ ...prev, audioLevel: level }));

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  }, []);

  /**
   * Get current audio blob
   */
  const getAudioBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) return null;
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    
    return new Blob(chunksRef.current, { type: mimeType });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    requestPermission,
    getAudioBlob,
  };
}

export default useAudioCapture;
