/**
 * IVAS API Client
 * Client for communicating with the IVAS Spring Boot backend (port 8084)
 * and Python AI services (port 8085)
 */

import axios, { AxiosInstance } from 'axios';
import type {
  HealthCheckResponse,
  GenerateQuestionRequest,
  GenerateQuestionResponse,
  AssessResponseRequest,
  AssessResponseResponse,
  StartVivaSessionRequest,
  StartVivaSessionResponse,
  VivaSession,
  VivaDashboardStats,
  StudentVivaResult,
  SynthesizeRequest,
} from '@/types/ivas';

// =============================================================================
// Configuration
// =============================================================================

// Spring Boot IVAS Backend (session management, database)
const IVAS_BACKEND_URL = process.env.NEXT_PUBLIC_IVAS_API_URL || 'http://localhost:8084';

// Python AI Services (ASR, TTS, LLM)
const IVAS_AI_URL = process.env.NEXT_PUBLIC_IVAS_AI_URL || 'http://localhost:8085';

// WebSocket URL for real-time voice streaming
export const IVAS_WS_URL = process.env.NEXT_PUBLIC_IVAS_WS_URL || 'ws://localhost:8085';

// =============================================================================
// Axios Instances
// =============================================================================

const backendClient: AxiosInstance = axios.create({
  baseURL: IVAS_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const aiClient: AxiosInstance = axios.create({
  baseURL: IVAS_AI_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // AI operations can take longer
});

// Add auth interceptor for backend client
backendClient.interceptors.request.use((config) => {
  // TODO: Add auth token from session
  // const token = getAuthToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// =============================================================================
// AI Services API (Python FastAPI - port 8085)
// =============================================================================

export const ivasAI = {
  /**
   * Health check for all AI services
   */
  health: async (): Promise<HealthCheckResponse> => {
    const response = await aiClient.get<HealthCheckResponse>('/ivas/health');
    return response.data;
  },

  /**
   * Transcribe audio file to text
   */
  transcribe: async (audioFile: File | Blob): Promise<{ transcript: string; confidence: number; duration: number }> => {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await aiClient.post('/ivas/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Synthesize speech from text
   */
  synthesize: async (request: SynthesizeRequest): Promise<Blob> => {
    const response = await aiClient.post('/ivas/synthesize', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generate a Socratic question
   */
  generateQuestion: async (request: GenerateQuestionRequest): Promise<GenerateQuestionResponse> => {
    const response = await aiClient.post<GenerateQuestionResponse>('/ivas/generate-question', request);
    return response.data;
  },

  /**
   * Assess a student's response
   */
  assessResponse: async (request: AssessResponseRequest): Promise<AssessResponseResponse> => {
    const response = await aiClient.post<AssessResponseResponse>('/ivas/assess-response', request);
    return response.data;
  },

  /**
   * Get active WebSocket sessions
   */
  getSessions: async (): Promise<{ active_count: number; sessions: Array<{ session_id: string; status: string }> }> => {
    const response = await aiClient.get('/ivas/sessions');
    return response.data;
  },
};

// =============================================================================
// Backend API (Spring Boot - port 8084)
// =============================================================================

export const ivasBackend = {
  /**
   * Health check for Spring Boot backend
   */
  health: async (): Promise<{ status: string }> => {
    const response = await backendClient.get('/api/v1/viva/health');
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  /**
   * Start a new viva session
   */
  startSession: async (request: StartVivaSessionRequest): Promise<StartVivaSessionResponse> => {
    const response = await backendClient.post<StartVivaSessionResponse>(
      '/api/v1/viva/sessions',
      request
    );
    return response.data;
  },

  /**
   * Get a viva session by ID
   */
  getSession: async (sessionId: string): Promise<VivaSession> => {
    const response = await backendClient.get<VivaSession>(
      `/api/v1/viva/sessions/${sessionId}`
    );
    return response.data;
  },

  /**
   * End a viva session
   */
  endSession: async (sessionId: string): Promise<VivaSession> => {
    const response = await backendClient.post<VivaSession>(
      `/api/v1/viva/sessions/${sessionId}/end`
    );
    return response.data;
  },

  /**
   * Get all sessions for an assignment
   */
  getAssignmentSessions: async (assignmentId: string): Promise<VivaSession[]> => {
    const response = await backendClient.get<VivaSession[]>(
      `/api/v1/viva/assignments/${assignmentId}/sessions`
    );
    return response.data;
  },

  /**
   * Get student's session for an assignment
   */
  getStudentSession: async (assignmentId: string, studentId: string): Promise<VivaSession | null> => {
    try {
      const response = await backendClient.get<VivaSession>(
        `/api/v1/viva/assignments/${assignmentId}/students/${studentId}/session`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // Dashboard & Analytics (Instructor)
  // ---------------------------------------------------------------------------

  /**
   * Get viva dashboard stats for an assignment
   */
  getDashboard: async (assignmentId: string): Promise<VivaDashboardStats> => {
    const response = await backendClient.get<VivaDashboardStats>(
      `/api/v1/viva/assignments/${assignmentId}/dashboard`
    );
    return response.data;
  },

  /**
   * Get all student results for an assignment
   */
  getStudentResults: async (assignmentId: string): Promise<StudentVivaResult[]> => {
    const response = await backendClient.get<StudentVivaResult[]>(
      `/api/v1/viva/assignments/${assignmentId}/results`
    );
    return response.data;
  },

  /**
   * Get session transcript
   */
  getTranscript: async (sessionId: string): Promise<{ turns: Array<{ speaker: string; text: string; timestamp: string }> }> => {
    const response = await backendClient.get(
      `/api/v1/viva/sessions/${sessionId}/transcript`
    );
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Get viva configuration for an assignment
   */
  getConfiguration: async (assignmentId: string): Promise<{
    enabled: boolean;
    duration: number;
    questionCount: number;
    topics: string[];
  }> => {
    const response = await backendClient.get(
      `/api/v1/viva/assignments/${assignmentId}/configuration`
    );
    return response.data;
  },

  /**
   * Update viva configuration
   */
  updateConfiguration: async (
    assignmentId: string,
    config: { enabled?: boolean; duration?: number; topics?: string[] }
  ): Promise<void> => {
    await backendClient.put(
      `/api/v1/viva/assignments/${assignmentId}/configuration`,
      config
    );
  },
};

// =============================================================================
// Combined API Export
// =============================================================================

export const ivasApi = {
  ai: ivasAI,
  backend: ivasBackend,
  wsUrl: IVAS_WS_URL,
};

export default ivasApi;
