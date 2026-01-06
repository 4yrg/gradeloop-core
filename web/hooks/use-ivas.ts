/**
 * useIvas Hook
 * Main hook for IVAS viva session management
 * Combines WebSocket, audio capture, and API functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { IvasWebSocket, getIvasWebSocket, type IvasWSCallbacks } from '@/lib/services/ivas-websocket';
import { ivasAI } from '@/lib/api/ivas';
import type {
  ConversationTurn,
  WSAssessment,
  WSSessionEnd,
  WSConnectionEstablished,
} from '@/types/ivas';

// =============================================================================
// Types
// =============================================================================

export type SessionState =
  | 'idle'           // Not started
  | 'connecting'     // Connecting to WebSocket
  | 'ready'          // Connected, waiting for interaction
  | 'ai_speaking'    // AI is asking question / responding
  | 'user_speaking'  // User is answering
  | 'processing'     // Processing user's answer
  | 'ended'          // Session completed
  | 'error';         // Error state

export interface IvasSessionState {
  /** Current session state */
  state: SessionState;
  /** Session ID */
  sessionId: string | null;
  /** Current AI question */
  currentQuestion: string | null;
  /** User's transcribed response */
  userTranscript: string | null;
  /** Last assessment feedback */
  lastAssessment: WSAssessment | null;
  /** Final assessment (when session ends) */
  finalAssessment: WSSessionEnd | null;
  /** Conversation history */
  conversationHistory: ConversationTurn[];
  /** Current question number */
  questionNumber: number;
  /** Error message if any */
  error: string | null;
  /** Is audio playing */
  isAudioPlaying: boolean;
}

export interface UseIvasOptions {
  /** Code context for questions */
  code?: string;
  /** Topic for questions */
  topic?: string;
  /** Student ID */
  studentId?: string;
  /** Assignment ID */
  assignmentId?: string;
  /** Called when session ends */
  onSessionEnd?: (assessment: WSSessionEnd) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useIvas(options: UseIvasOptions = {}) {
  const {
    code = '',
    topic = 'programming',
    studentId = 'student',
    assignmentId = 'assignment',
    onSessionEnd,
    onError,
  } = options;

  // State
  const [state, setState] = useState<IvasSessionState>({
    state: 'idle',
    sessionId: null,
    currentQuestion: null,
    userTranscript: null,
    lastAssessment: null,
    finalAssessment: null,
    conversationHistory: [],
    questionNumber: 0,
    error: null,
    isAudioPlaying: false,
  });

  // Refs
  const wsRef = useRef<IvasWebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Start a viva session
   */
  const startSession = useCallback(async (sessionId?: string) => {
    const sid = sessionId || `viva-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setState(prev => ({ ...prev, state: 'connecting', sessionId: sid, error: null }));

    const callbacks: IvasWSCallbacks = {
      onConnected: (data: WSConnectionEstablished) => {
        console.log('[useIvas] Connected:', data);
        // Set to ai_speaking since initial question is sent immediately after connection
        setState(prev => ({ ...prev, state: 'ai_speaking' }));
      },

      onAIResponse: (response: string) => {
        console.log('[useIvas] AI Response:', response);
        setState(prev => ({
          ...prev,
          state: 'ai_speaking',
          currentQuestion: response,
          questionNumber: prev.questionNumber + 1,
          conversationHistory: [
            ...prev.conversationHistory,
            {
              speaker: 'AI',
              text: response,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      },

      onAIAudio: (audioBase64: string) => {
        console.log('[useIvas] AI Audio received');
        playAudioFromBase64(audioBase64);
      },

      onTranscript: (transcript: string) => {
        console.log('[useIvas] Transcript:', transcript);
        setState(prev => ({
          ...prev,
          userTranscript: transcript,
          state: 'processing',
          conversationHistory: [
            ...prev.conversationHistory,
            {
              speaker: 'STUDENT',
              text: transcript,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      },

      onAssessment: (assessment: WSAssessment) => {
        console.log('[useIvas] Assessment:', assessment);
        setState(prev => ({ ...prev, lastAssessment: assessment }));
      },

      onSessionEnd: (finalAssessment: WSSessionEnd) => {
        console.log('[useIvas] Session ended:', finalAssessment);
        setState(prev => ({
          ...prev,
          state: 'ended',
          finalAssessment: finalAssessment,
        }));
        onSessionEnd?.(finalAssessment);
      },

      onError: (error: string) => {
        console.error('[useIvas] Error:', error);
        setState(prev => ({ ...prev, error, state: 'error' }));
        onError?.(error);
      },

      onDisconnected: () => {
        console.log('[useIvas] Disconnected');
        if (state.state !== 'ended') {
          setState(prev => ({ ...prev, state: 'idle' }));
        }
      },
    };

    const ws = getIvasWebSocket();
    wsRef.current = ws;

    ws.connect(sid, callbacks, {
      studentId,
      assignmentId,
      code,  // Don't double-encode - IvasWebSocket builds URL with query params
      topic,
    });
  }, [code, topic, studentId, assignmentId, onSessionEnd, onError, state.state]);

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    if (wsRef.current?.isConnected) {
      wsRef.current.endSession();
    }
  }, []);

  /**
   * Signal end of user's speaking turn
   */
  const endUserTurn = useCallback(() => {
    if (wsRef.current?.isConnected) {
      wsRef.current.endTurn();
      setState(prev => ({ ...prev, state: 'processing' }));
    }
  }, []);

  /**
   * Send audio chunk (for streaming)
   */
  const sendAudioChunk = useCallback((audioBase64: string) => {
    wsRef.current?.sendAudioChunk(audioBase64);
  }, []);

  /**
   * Start user speaking state
   */
  const startSpeaking = useCallback(() => {
    setState(prev => ({ ...prev, state: 'user_speaking', userTranscript: null }));
  }, []);

  /**
   * Stop user speaking and process
   */
  const stopSpeaking = useCallback(() => {
    endUserTurn();
  }, [endUserTurn]);

  /**
   * Request next question
   */
  const requestNextQuestion = useCallback((difficulty?: 'easier' | 'same' | 'harder') => {
    wsRef.current?.requestQuestion(difficulty);
  }, []);

  /**
   * Play audio from base64
   */
  const playAudioFromBase64 = useCallback((base64Audio: string) => {
    // Queue audio if already playing
    if (state.isAudioPlaying) {
      audioQueueRef.current.push(base64Audio);
      return;
    }

    try {
      // Decode base64 to blob
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Edge TTS outputs MP3 - use directly (smaller and faster)
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setState(prev => ({ ...prev, isAudioPlaying: true }));

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setState(prev => ({ ...prev, isAudioPlaying: false, state: 'ready' }));

        // Play next in queue
        const next = audioQueueRef.current.shift();
        if (next) {
          playAudioFromBase64(next);
        }
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        setState(prev => ({ ...prev, isAudioPlaying: false, state: 'ready' }));
      };

      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        setState(prev => ({ ...prev, isAudioPlaying: false, state: 'ready' }));
      });
    } catch (error) {
      console.error('Failed to decode audio:', error);
      setState(prev => ({ ...prev, isAudioPlaying: false, state: 'ready' }));
    }
  }, [state.isAudioPlaying]);

  /**
   * Check if AI services are healthy
   */
  const checkHealth = useCallback(async () => {
    try {
      const health = await ivasAI.health();
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    wsRef.current?.disconnect();
    setState({
      state: 'idle',
      sessionId: null,
      currentQuestion: null,
      userTranscript: null,
      lastAssessment: null,
      finalAssessment: null,
      conversationHistory: [],
      questionNumber: 0,
      error: null,
      isAudioPlaying: false,
    });
  }, []);

  return {
    // State
    ...state,
    isConnected: wsRef.current?.isConnected ?? false,

    // Actions
    startSession,
    endSession,
    startSpeaking,
    stopSpeaking,
    sendAudioChunk,
    requestNextQuestion,
    checkHealth,
    reset,
  };
}

export default useIvas;
