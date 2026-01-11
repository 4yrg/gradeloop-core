/**
 * Keystroke Analytics Service
 * API client for keystroke authentication analytics
 */

const KEYSTROKE_ANALYTICS_API_BASE = process.env.NEXT_PUBLIC_KEYSTROKE_ANALYTICS_API_URL || 'http://localhost:8085/api/analytics';

export interface KeystrokeEvent {
  id: number;
  studentId: string;
  assignmentId: string;
  courseId: string;
  sessionId: string;
  confidenceLevel: number;
  riskScore: number;
  keystrokeSampleSize: number;
  eventTimestamp: string;
  authenticated: boolean;
  similarityScore: number;
  createdAt: string;
}

export interface StudentKeystrokeSummary {
  studentId: string;
  assignmentId: string;
  totalEvents: number;
  averageConfidence: number;
  averageRiskScore: number;
  minConfidence: number;
  maxConfidence: number;
  suspiciousEvents: number;
  firstEventTime: string | null;
  lastEventTime: string | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

class KeystrokeAnalyticsService {
  /**
   * Get all keystroke events for a student on an assignment
   */
  async getStudentAssignmentEvents(
    studentId: string,
    assignmentId: string
  ): Promise<KeystrokeEvent[]> {
    const response = await fetch(
      `${KEYSTROKE_ANALYTICS_API_BASE}/student/${studentId}/assignment/${assignmentId}/events`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch keystroke events');
    }

    return response.json();
  }

  /**
   * Get paginated keystroke events for a student on an assignment
   */
  async getStudentAssignmentEventsPaged(
    studentId: string,
    assignmentId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PagedResponse<KeystrokeEvent>> {
    const response = await fetch(
      `${KEYSTROKE_ANALYTICS_API_BASE}/student/${studentId}/assignment/${assignmentId}/events/paged?page=${page}&size=${size}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch paginated keystroke events');
    }

    return response.json();
  }

  /**
   * Get summary statistics for a student on an assignment
   */
  async getStudentAssignmentSummary(
    studentId: string,
    assignmentId: string
  ): Promise<StudentKeystrokeSummary> {
    const response = await fetch(
      `${KEYSTROKE_ANALYTICS_API_BASE}/student/${studentId}/assignment/${assignmentId}/summary`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch keystroke summary');
    }

    return response.json();
  }

  /**
   * Get all suspicious events for an assignment
   */
  async getSuspiciousEvents(assignmentId: string): Promise<KeystrokeEvent[]> {
    const response = await fetch(
      `${KEYSTROKE_ANALYTICS_API_BASE}/assignment/${assignmentId}/suspicious`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch suspicious events');
    }

    return response.json();
  }

  /**
   * Get all keystroke events for an assignment
   */
  async getAssignmentEvents(assignmentId: string): Promise<KeystrokeEvent[]> {
    const response = await fetch(
      `${KEYSTROKE_ANALYTICS_API_BASE}/assignment/${assignmentId}/events`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch assignment events');
    }

    return response.json();
  }

  /**
   * Get all keystroke events for a course
   */
  async getCourseEvents(courseId: string): Promise<KeystrokeEvent[]> {
    const response = await fetch(
      `${KEYSTROKE_ANALYTICS_API_BASE}/course/${courseId}/events`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch course events');
    }

    return response.json();
  }

  /**
   * Get risk level color based on risk level
   */
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-500 border-green-500/20 bg-green-500/5';
      case 'MEDIUM':
        return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5';
      case 'HIGH':
        return 'text-red-500 border-red-500/20 bg-red-500/5';
      default:
        return 'text-gray-500 border-gray-500/20 bg-gray-500/5';
    }
  }

  /**
   * Get confidence level color
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }

  /**
   * Format timestamp to relative time
   */
  formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

export const keystrokeAnalyticsService = new KeystrokeAnalyticsService();
