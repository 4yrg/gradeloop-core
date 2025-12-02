/**
 * WebSocket client for IVAS real-time voice communication
 * Handles connection, audio streaming, and message protocol
 */

export type WSMessageType =
  | "connection"
  | "session_started"
  | "audio_chunk"
  | "transcript"
  | "ai_response"
  | "ai_audio"
  | "error"
  | "session_end";

export interface WSMessage {
  type: WSMessageType;
  data: any;
  timestamp: string;
}

export interface SessionStartData {
  student_id: string;
  student_name: string;
  lab_assignment: string;
  student_code: string;
}

export interface AudioChunkData {
  audio: string; // base64 encoded
  format: "webm" | "wav" | "mp3";
  is_final: boolean;
}

export interface TranscriptData {
  text: string;
}

export interface AIResponseData {
  text: string;
}

export interface AIAudioData {
  audio: string; // base64 encoded
  format: "wav";
}

export interface ErrorData {
  message: string;
}

export interface SessionEndData {
  message: string;
  turn_count?: number;
}

type MessageHandler = (data: any) => void;

export class IVASWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<WSMessageType, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private isIntentionallyClosed = false;

  constructor(sessionId: string, baseUrl: string = "ws://localhost:8000") {
    this.url = `${baseUrl}/ivas/ws/${sessionId}`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("✅ WebSocket connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            console.log(`📩 Received ${message.type}:`, message.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket closed (code: ${event.code})`);

          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(
              `🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );
            setTimeout(() => {
              this.connect().catch(console.error);
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WSMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }

  /**
   * Register message handler
   */
  on(type: WSMessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Unregister message handler
   */
  off(type: WSMessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send message to server
   */
  private send(type: WSMessageType, data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    const message: Omit<WSMessage, "timestamp"> = { type, data };
    this.ws.send(JSON.stringify(message));
    console.log(`📤 Sent ${type}:`, data);
  }

  /**
   * Start viva session
   */
  startSession(data: SessionStartData): void {
    this.send("session_start" as WSMessageType, data);
  }

  /**
   * Send audio chunk to server
   */
  sendAudioChunk(audioBlob: Blob, isFinal: boolean = false): void {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const data: AudioChunkData = {
        audio: base64Audio,
        format: "webm",
        is_final: isFinal,
      };

      this.send("audio_chunk", data);
    };
    reader.readAsArrayBuffer(audioBlob);
  }

  /**
   * End viva session
   */
  endSession(): void {
    this.send("session_end", {});
  }

  /**
   * Close WebSocket connection
   */
  close(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
