/**
 * IVAS WebSocket Service
 * Handles real-time voice streaming for viva sessions
 */

import type {
  WSMessage,
  WSConnectionEstablished,
  WSAssessment,
  WSSessionEnd,
  WSError,
} from '@/types/ivas';
import { IVAS_WS_URL } from '@/lib/api/ivas';

// =============================================================================
// Types
// =============================================================================

export interface IvasWSCallbacks {
  /** Called when connection is established */
  onConnected?: (data: WSConnectionEstablished) => void;
  /** Called when student's speech is transcribed */
  onTranscript?: (transcript: string) => void;
  /** Called when AI responds with text */
  onAIResponse?: (response: string) => void;
  /** Called when AI audio is ready (base64 encoded) */
  onAIAudio?: (audioBase64: string) => void;
  /** Called when assessment feedback is received */
  onAssessment?: (assessment: WSAssessment) => void;
  /** Called when session ends with final assessment */
  onSessionEnd?: (finalAssessment: WSSessionEnd) => void;
  /** Called on any error */
  onError?: (error: string) => void;
  /** Called when connection closes */
  onDisconnected?: () => void;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// =============================================================================
// IvasWebSocket Class
// =============================================================================

export class IvasWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: IvasWSCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private sessionId: string | null = null;
  private connectionState: ConnectionState = 'disconnected';

  /**
   * Get current connection state
   */
  get state(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to IVAS WebSocket server
   */
  connect(
    sessionId: string,
    callbacks: IvasWSCallbacks,
    params?: {
      studentId?: string;
      assignmentId?: string;
      code?: string;
      topic?: string;
    }
  ): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.sessionId = sessionId;
    this.callbacks = callbacks;
    this.connectionState = 'connecting';

    // Build URL with query params
    const url = new URL(`${IVAS_WS_URL}/ivas/ws/${sessionId}`);
    if (params?.studentId) url.searchParams.set('student_id', params.studentId);
    if (params?.assignmentId) url.searchParams.set('assignment_id', params.assignmentId);
    if (params?.code) url.searchParams.set('code', params.code);
    if (params?.topic) url.searchParams.set('topic', params.topic);

    console.log(`[IvasWS] Connecting to ${url.toString()}`);

    try {
      this.ws = new WebSocket(url.toString());
      this.setupEventHandlers();
    } catch (error) {
      console.error('[IvasWS] Failed to create WebSocket:', error);
      this.connectionState = 'error';
      callbacks.onError?.('Failed to create WebSocket connection');
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('[IvasWS] Disconnecting...');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.sessionId = null;
  }

  /**
   * Send audio chunk (base64 encoded)
   */
  sendAudioChunk(audioBase64: string): void {
    this.sendMessage({
      type: 'audio_chunk',
      data: audioBase64,
    });
  }

  /**
   * Send raw audio bytes
   */
  sendAudioBytes(audioBytes: ArrayBuffer): void {
    if (!this.isConnected) {
      console.warn('[IvasWS] Cannot send audio: not connected');
      return;
    }
    this.ws?.send(audioBytes);
  }

  /**
   * Signal end of speaking turn
   */
  endTurn(): void {
    this.sendMessage({
      type: 'end_turn',
      data: null,
    });
  }

  /**
   * Request a new question
   */
  requestQuestion(difficulty?: 'easier' | 'same' | 'harder'): void {
    this.sendMessage({
      type: 'request_question',
      data: { difficulty: difficulty || 'same' },
    });
  }

  /**
   * End the viva session
   */
  endSession(): void {
    this.sendMessage({
      type: 'end_session',
      data: null,
    });
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[IvasWS] Connected');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[IvasWS] Failed to parse message:', error);
      }
    };

    this.ws.onerror = (event) => {
      console.error('[IvasWS] Error:', event);
      this.connectionState = 'error';
      this.callbacks.onError?.('WebSocket error occurred');
    };

    this.ws.onclose = (event) => {
      console.log(`[IvasWS] Closed: code=${event.code}, reason=${event.reason}`);
      this.connectionState = 'disconnected';
      this.callbacks.onDisconnected?.();

      // Attempt reconnect if not intentional close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };
  }

  private handleMessage(message: WSMessage): void {
    console.log(`[IvasWS] Received: ${message.type}`);

    switch (message.type) {
      case 'connection_established':
        this.callbacks.onConnected?.(message.data as WSConnectionEstablished);
        break;

      case 'transcript':
        this.callbacks.onTranscript?.(message.data as string);
        break;

      case 'ai_response':
        this.callbacks.onAIResponse?.(message.data as string);
        break;

      case 'ai_audio':
        this.callbacks.onAIAudio?.(message.data as string);
        break;

      case 'assessment':
        this.callbacks.onAssessment?.(message.data as WSAssessment);
        break;

      case 'session_end':
        this.callbacks.onSessionEnd?.(message.data as WSSessionEnd);
        break;

      case 'error':
        const error = message.data as WSError;
        this.callbacks.onError?.(error.message);
        break;

      default:
        console.warn(`[IvasWS] Unknown message type: ${message.type}`);
    }
  }

  private sendMessage(message: { type: string; data: unknown }): void {
    if (!this.isConnected) {
      console.warn('[IvasWS] Cannot send message: not connected');
      return;
    }
    this.ws?.send(JSON.stringify(message));
    console.log(`[IvasWS] Sent: ${message.type}`);
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    console.log(`[IvasWS] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

    setTimeout(() => {
      if (this.sessionId && this.callbacks) {
        this.connect(this.sessionId, this.callbacks);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let wsInstance: IvasWebSocket | null = null;

export function getIvasWebSocket(): IvasWebSocket {
  if (!wsInstance) {
    wsInstance = new IvasWebSocket();
  }
  return wsInstance;
}

export function resetIvasWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}

export default IvasWebSocket;
