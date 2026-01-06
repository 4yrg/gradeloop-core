/**
 * Behavioral Analysis Service
 * Analyzes keystroke data for authenticity and learning patterns
 */

import { apiClient } from './axios';

const KEYSTROKE_API_URL = process.env.NEXT_PUBLIC_KEYSTROKE_API_URL || 'http://localhost:8000/api/keystroke';

// ==================== Types ====================

export interface KeystrokeSessionEvent {
  timestamp: number;
  key: string;
  keyCode: number;
  dwellTime: number;
  flightTime: number;
  action: string;
  lineNumber?: number;
  columnNumber?: number;
  codeSnapshot?: string;
}

export interface SessionMetrics {
  total_duration: number;
  total_keystrokes: number;
  average_typing_speed: number;
  pause_count: number;
  long_pause_count: number;
  deletion_count: number;
  deletion_rate: number;
  paste_count: number;
  copy_count: number;
  avg_dwell_time: number;
  std_dwell_time: number;
  avg_flight_time: number;
  std_flight_time: number;
  burst_typing_events: number;
  rhythm_consistency: number;
  friction_points: FrictionPoint[];
}

export interface FrictionPoint {
  timestamp: number;
  duration: number;
  deletion_rate: number;
  long_pauses: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AuthenticityIndicators {
  human_signature_score: number;
  synthetic_signature_score: number;
  consistency_score: number;
  anomaly_flags: AnomalyFlag[];
  multiple_contributor_probability: number;
  external_assistance_probability: number;
}

export interface AnomalyFlag {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
}

export interface PivotalMoment {
  timestamp: number;
  description: string;
  deletion_count: number;
}

export interface CognitiveLoadPoint {
  timestamp: number;
  load: number;
}

export interface StruggleArea {
  timestamp: number;
  duration: number;
  indicator: string;
}

export interface CognitiveAnalysis {
  incremental_construction: boolean;
  pivotal_moments: PivotalMoment[];
  troubleshooting_style: 'systematic' | 'erratic' | 'confident';
  cognitive_load_timeline: CognitiveLoadPoint[];
  high_friction_concepts: string[];
  struggle_areas: StruggleArea[];
  mastery_indicators: string[];
}

export interface ProcessScore {
  active_problem_solving_score: number;
  learning_depth_score: number;
  authenticity_score: number;
  engagement_score: number;
  overall_score: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PedagogicalFeedback {
  struggle_concepts: string[];
  recommendations: string[];
  narrative?: string;
  style?: string;
}

export interface BehavioralAnalysisResult {
  session_id: string;
  student_id: string;
  timestamp: string;
  session_metrics: SessionMetrics;
  authenticity_indicators: AuthenticityIndicators;
  cognitive_analysis: CognitiveAnalysis;
  process_score: ProcessScore;
  llm_insights: Record<string, any>;
  critical_anomalies: string[];
  pedagogical_feedback: PedagogicalFeedback;
  formatted_report?: string;
}

export interface BehavioralAnalysisRequest {
  sessionId: string;
  studentId: string;
  events: KeystrokeSessionEvent[];
  finalCode: string;
  includeReport?: boolean;
}

export interface AnalysisConfig {
  llm_enabled: boolean;
  llm_model: string | null;
  analysis_features: string[];
  metrics_tracked: string[];
}

// ==================== Service ====================

class BehavioralAnalysisService {
  private api;

  constructor() {
    this.api = apiClient;
  }

  /**
   * Analyze a complete coding session for behavioral insights
   */
  async analyzeSession(request: BehavioralAnalysisRequest): Promise<BehavioralAnalysisResult> {
    try {
      const response = await this.api.post<{ success: boolean; analysis: BehavioralAnalysisResult }>(
        `${KEYSTROKE_API_URL}/analyze`,
        request
      );
      
      if (!response.data.success) {
        throw new Error('Analysis failed');
      }
      
      return response.data.analysis;
    } catch (error: any) {
      console.error('Error analyzing session:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Analysis failed');
    }
  }

  /**
   * Get configuration and status of the behavioral analysis system
   */
  async getAnalysisConfig(): Promise<AnalysisConfig> {
    try {
      const response = await this.api.get<{ success: boolean; config: AnalysisConfig }>(
        `${KEYSTROKE_API_URL}/analyze/config`
      );
      return response.data.config;
    } catch (error: any) {
      console.error('Error fetching analysis config:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch config');
    }
  }

  /**
   * Format process score for display
   */
  formatProcessScore(score: ProcessScore): string {
    const level = score.confidence_level;
    const emoji = level === 'HIGH' ? '✅' : level === 'MEDIUM' ? '⚠️' : '❌';
    return `${emoji} ${score.overall_score.toFixed(1)}/100 (${level})`;
  }

  /**
   * Get severity color for anomalies
   */
  getAnomalySeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  /**
   * Get authenticity assessment label
   */
  getAuthenticityLabel(indicators: AuthenticityIndicators): {
    label: string;
    color: string;
    emoji: string;
  } {
    const score = indicators.human_signature_score;
    const synthetic = indicators.synthetic_signature_score;
    
    if (score >= 80 && synthetic < 30) {
      return { label: 'Highly Authentic', color: 'text-green-600', emoji: '✅' };
    } else if (score >= 60 && synthetic < 50) {
      return { label: 'Likely Authentic', color: 'text-blue-600', emoji: '✓' };
    } else if (score >= 40 || synthetic >= 60) {
      return { label: 'Questionable', color: 'text-yellow-600', emoji: '⚠️' };
    } else {
      return { label: 'High Risk', color: 'text-red-600', emoji: '❌' };
    }
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Calculate risk level from anomalies and scores
   */
  calculateRiskLevel(analysis: BehavioralAnalysisResult): {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
  } {
    const { authenticity_indicators, critical_anomalies } = analysis;
    
    let riskScore = 0;
    
    // Factor in synthetic signature
    riskScore += authenticity_indicators.synthetic_signature_score * 0.4;
    
    // Factor in external assistance probability
    riskScore += authenticity_indicators.external_assistance_probability * 100 * 0.3;
    
    // Factor in critical anomalies
    riskScore += critical_anomalies.length * 10;
    
    // Factor in authenticity score (inverse)
    riskScore += (100 - authenticity_indicators.human_signature_score) * 0.3;
    
    riskScore = Math.min(100, riskScore);
    
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 75) {
      level = 'critical';
    } else if (riskScore >= 50) {
      level = 'high';
    } else if (riskScore >= 25) {
      level = 'medium';
    } else {
      level = 'low';
    }
    
    return { level, score: riskScore };
  }
}

export const behavioralAnalysisService = new BehavioralAnalysisService();
