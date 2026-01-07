/**
 * IVAS (Intelligent Viva Assessment System) Types
 * Types for viva assessment API and WebSocket communication
 */

// =============================================================================
// Session Types
// =============================================================================

export type VivaSessionStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'paused'
  | 'error';

export interface VivaSession {
  sessionId: string;
  studentId: string;
  assignmentId: string;
  courseId: string;
  status: VivaSessionStatus;
  startTime?: string;
  endTime?: string;
  totalTurns: number;
  currentQuestion?: string;
  conversationHistory: ConversationTurn[];
  finalAssessment?: FinalAssessment;
}

export interface ConversationTurn {
  speaker: 'AI' | 'STUDENT';
  text: string;
  timestamp: string;
  audioDuration?: number;
}

// =============================================================================
// Question & Assessment Types
// =============================================================================

export interface GenerateQuestionRequest {
  code?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'easier' | 'same' | 'harder';
  conversationHistory?: ConversationTurn[];
}

export interface GenerateQuestionResponse {
  question: string;
  difficulty: string;
  topic: string;
  followUpHints: string[];
}

export interface AssessResponseRequest {
  question: string;
  response: string;
  expectedConcepts?: string[];
  codeContext?: string;
}

export interface AssessResponseResponse {
  understandingLevel: 'none' | 'minimal' | 'partial' | 'good' | 'excellent';
  clarity: 'confused' | 'unclear' | 'clear' | 'very_clear';
  confidenceScore: number;
  misconceptions: string[];
  strengths: string[];
  areasForImprovement: string[];
  suggestedFollowUp?: string;
}

export interface FinalAssessment {
  overallScore: number;
  competencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'PROFICIENT' | 'EXPERT';
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  fullAnalysis: string;
  sessionId: string;
  totalTurns: number;
  durationMinutes: number;
}

// =============================================================================
// ASR & TTS Types
// =============================================================================

export interface TranscribeResponse {
  transcript: string;
  confidence: number;
  duration: number;
  language: string;
}

export interface SynthesizeRequest {
  text: string;
  emotion?: 'neutral' | 'friendly' | 'professional' | 'empathetic' | 'encouraging';
  speed?: number;
  language?: string;
}

// =============================================================================
// WebSocket Message Types
// =============================================================================

export type WSMessageType = 
  | 'connection_established'
  | 'transcript'
  | 'ai_response'
  | 'ai_audio'
  | 'assessment'
  | 'session_end'
  | 'error'
  | 'audio_chunk'
  | 'end_turn'
  | 'request_question'
  | 'end_session';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  data: T;
}

export interface WSConnectionEstablished {
  sessionId: string;
  status: string;
  message: string;
}

export interface WSTranscript {
  text: string;
}

export interface WSAIResponse {
  text: string;
}

export interface WSAIAudio {
  data: string; // base64 encoded audio
}

export interface WSAssessment extends AssessResponseResponse {}

export interface WSSessionEnd extends FinalAssessment {}

export interface WSError {
  message: string;
}

// =============================================================================
// Health Check Types
// =============================================================================

export interface ServiceStatus {
  status: 'available' | 'unavailable' | 'loading';
  model?: string;
  active_sessions?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  services: {
    asr: ServiceStatus;
    tts: ServiceStatus;
    llm: ServiceStatus;
    websocket?: ServiceStatus;
  };
}

// =============================================================================
// Dashboard Types (for Instructor)
// =============================================================================

export interface VivaDashboardStats {
  totalStudents: number;
  vivasCompleted: number;
  vivasInProgress: number;
  vivasPending: number;
  averageScore: number;
  averageDuration: number;
}

export interface StudentVivaResult {
  studentId: string;
  studentName: string;
  sessionId: string;
  status: VivaSessionStatus;
  score?: number;
  duration?: number;
  completedAt?: string;
  strengths?: string[];
  weaknesses?: string[];
}

// =============================================================================
// Start Session Request (to Spring Boot backend)
// =============================================================================

export interface StartVivaSessionRequest {
  assignmentId: string;
  studentId: string;
  code: string;
  topic: string;
}

export interface StartVivaSessionResponse {
  sessionId: string;
  wsUrl: string;
  status: string;
}
