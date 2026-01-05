/**
 * API Service for Keystroke Authentication
 * Handles all backend communication for keystroke-based auth
 */

import { apiClient } from './axios';
import type { KeystrokeEvent } from '../hooks/use-keystroke-capture';

const KEYSTROKE_API_URL = process.env.NEXT_PUBLIC_KEYSTROKE_API_URL || 'http://localhost:8000/api/keystroke';

export interface EnrollmentResult {
  success: boolean;
  message?: string;
  userId?: string;
  modelId?: string;
}

export interface VerificationResult {
  success: boolean;
  confidence?: number;
  message?: string;
}

export interface IdentificationCandidate {
  userId: string;
  confidence: number;
  rank: number;
}

export interface IdentificationResult {
  success: boolean;
  candidates?: IdentificationCandidate[];
  topMatch?: IdentificationCandidate;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  message?: string;
}

export interface EnrolledUsersResponse {
  users: string[];
  count: number;
}

class KeystrokeAuthService {
  private api;

  constructor() {
    this.api = apiClient;
  }

  /**
   * Enroll a user with keystroke data
   */
  async enrollUser(userId: string, keystrokeEvents: KeystrokeEvent[]): Promise<EnrollmentResult> {
    try {
      const response = await this.api.post<EnrollmentResult>(
        `${KEYSTROKE_API_URL}/api/auth/enroll`,
        {
          userId,
          keystrokeEvents,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error enrolling user:', error);
      throw new Error(error.response?.data?.message || 'Enrollment failed');
    }
  }

  /**
   * Verify a user's identity
   */
  async verifyUser(
    userId: string,
    keystrokeEvents: KeystrokeEvent[],
    threshold = 0.7
  ): Promise<VerificationResult> {
    try {
      const response = await this.api.post<VerificationResult>(
        `${KEYSTROKE_API_URL}/api/auth/verify`,
        {
          userId,
          keystrokeEvents,
          threshold,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error verifying user:', error);
      throw new Error(error.response?.data?.message || 'Verification failed');
    }
  }

  /**
   * Identify a user from keystroke pattern
   * Compares against all enrolled users and returns top matches
   */
  async identifyUser(
    keystrokeEvents: KeystrokeEvent[],
    topK = 3
  ): Promise<IdentificationResult> {
    try {
      const response = await this.api.post<IdentificationResult>(
        `${KEYSTROKE_API_URL}/api/auth/identify`,
        {
          keystrokeEvents,
          topK,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error identifying user:', error);
      // Check if no users enrolled
      if (error.response?.status === 404) {
        throw new Error('No users enrolled yet. Please train at least one user first.');
      }
      throw new Error(error.response?.data?.message || 'Identification failed');
    }
  }

  /**
   * Get list of enrolled users
   */
  async getEnrolledUsers(): Promise<EnrolledUsersResponse> {
    try {
      const response = await this.api.get<EnrolledUsersResponse>(
        `${KEYSTROKE_API_URL}/api/auth/users`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching enrolled users:', error);
      return { users: [], count: 0 };
    }
  }
}

export const keystrokeAuthService = new KeystrokeAuthService();
