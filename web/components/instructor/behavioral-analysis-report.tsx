"use client"

import { useState } from 'react';
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Keyboard,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import type { BehavioralAnalysisResult } from '../../../lib/behavioral-analysis-service';
import { behavioralAnalysisService } from '../../../lib/behavioral-analysis-service';

interface BehavioralAnalysisReportProps {
  analysis: BehavioralAnalysisResult;
  onClose?: () => void;
}

export function BehavioralAnalysisReport({ analysis, onClose }: BehavioralAnalysisReportProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const riskLevel = behavioralAnalysisService.calculateRiskLevel(analysis);
  const authenticityLabel = behavioralAnalysisService.getAuthenticityLabel(
    analysis.authenticity_indicators
  );

  const downloadReport = () => {
    if (analysis.formatted_report) {
      const blob = new Blob([analysis.formatted_report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `behavioral-analysis-${analysis.student_id}-${analysis.session_id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Behavioral Analysis Report</h1>
          <p className="text-muted-foreground mt-1">
            Student: {analysis.student_id} • Session: {analysis.session_id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {analysis.formatted_report && (
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Risk Level Banner */}
      <Card className={`border-l-4 ${
        riskLevel.level === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/10' :
        riskLevel.level === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/10' :
        riskLevel.level === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/10' :
        'border-l-green-500 bg-green-50 dark:bg-green-950/10'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {riskLevel.level === 'critical' || riskLevel.level === 'high' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                Risk Level: {riskLevel.level.toUpperCase()}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {authenticityLabel.emoji} {authenticityLabel.label}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{riskLevel.score.toFixed(0)}/100</div>
              <div className="text-sm text-muted-foreground">Risk Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="authenticity">Authenticity</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.process_score.overall_score.toFixed(1)}/100
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.process_score.confidence_level} confidence
                </p>
                <Progress 
                  value={analysis.process_score.overall_score} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {behavioralAnalysisService.formatDuration(analysis.session_metrics.total_duration)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.session_metrics.total_keystrokes} keystrokes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Authenticity</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.process_score.authenticity_score.toFixed(0)}/100
                </div>
                <p className={`text-xs mt-1 ${authenticityLabel.color}`}>
                  {authenticityLabel.label}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problem Solving</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.process_score.active_problem_solving_score.toFixed(0)}/100
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.cognitive_analysis.troubleshooting_style}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Anomalies */}
          {analysis.critical_anomalies.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Anomalies Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.critical_anomalies.map((anomaly, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span className="text-sm">{anomaly}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Process Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Process Quality Scores</CardTitle>
              <CardDescription>Detailed evaluation of work process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Problem Solving</span>
                  <span className="text-sm text-muted-foreground">
                    {analysis.process_score.active_problem_solving_score.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={analysis.process_score.active_problem_solving_score} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Learning Depth</span>
                  <span className="text-sm text-muted-foreground">
                    {analysis.process_score.learning_depth_score.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={analysis.process_score.learning_depth_score} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Engagement</span>
                  <span className="text-sm text-muted-foreground">
                    {analysis.process_score.engagement_score.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={analysis.process_score.engagement_score} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Authenticity</span>
                  <span className="text-sm text-muted-foreground">
                    {analysis.process_score.authenticity_score.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={analysis.process_score.authenticity_score} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Session Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <MetricRow 
                    label="Total Duration" 
                    value={behavioralAnalysisService.formatDuration(analysis.session_metrics.total_duration)} 
                  />
                  <MetricRow 
                    label="Total Keystrokes" 
                    value={analysis.session_metrics.total_keystrokes.toString()} 
                  />
                  <MetricRow 
                    label="Typing Speed" 
                    value={`${analysis.session_metrics.average_typing_speed.toFixed(0)} CPM`} 
                  />
                  <MetricRow 
                    label="Deletion Rate" 
                    value={`${(analysis.session_metrics.deletion_rate * 100).toFixed(1)}%`} 
                  />
                  <MetricRow 
                    label="Paste Operations" 
                    value={analysis.session_metrics.paste_count.toString()} 
                  />
                </div>
                
                <div className="space-y-3">
                  <MetricRow 
                    label="Pause Count" 
                    value={analysis.session_metrics.pause_count.toString()} 
                  />
                  <MetricRow 
                    label="Long Pauses (>3s)" 
                    value={analysis.session_metrics.long_pause_count.toString()} 
                  />
                  <MetricRow 
                    label="Avg Dwell Time" 
                    value={`${analysis.session_metrics.avg_dwell_time.toFixed(0)}ms`} 
                  />
                  <MetricRow 
                    label="Avg Flight Time" 
                    value={`${analysis.session_metrics.avg_flight_time.toFixed(0)}ms`} 
                  />
                  <MetricRow 
                    label="Rhythm Consistency" 
                    value={`${(analysis.session_metrics.rhythm_consistency * 100).toFixed(0)}%`} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Friction Points */}
          {analysis.session_metrics.friction_points.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Friction Points</CardTitle>
                <CardDescription>Moments of struggle during the session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.session_metrics.friction_points.map((fp, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <div className="font-medium">
                          {behavioralAnalysisService.formatDuration(fp.timestamp / 1000)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {fp.duration.toFixed(1)}s • Deletion rate: {(fp.deletion_rate * 100).toFixed(0)}%
                        </div>
                      </div>
                      <Badge variant={fp.severity === 'high' ? 'destructive' : 'secondary'}>
                        {fp.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Authenticity Tab */}
        <TabsContent value="authenticity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authenticity Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Human Signature</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {analysis.authenticity_indicators.human_signature_score.toFixed(0)}/100
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Natural patterns and variations
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Synthetic Signature</h4>
                  <div className="text-3xl font-bold text-red-600">
                    {analysis.authenticity_indicators.synthetic_signature_score.toFixed(0)}/100
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI/copy-paste indicators
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Risk Probabilities</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">External Assistance</span>
                      <span className="text-sm font-medium">
                        {(analysis.authenticity_indicators.external_assistance_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={analysis.authenticity_indicators.external_assistance_probability * 100} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Multiple Contributors</span>
                      <span className="text-sm font-medium">
                        {(analysis.authenticity_indicators.multiple_contributor_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={analysis.authenticity_indicators.multiple_contributor_probability * 100} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly Flags */}
          {analysis.authenticity_indicators.anomaly_flags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.authenticity_indicators.anomaly_flags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        behavioralAnalysisService.getAnomalySeverityColor(flag.severity)
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{flag.type.replace(/_/g, ' ').toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground mt-1">{flag.description}</div>
                      </div>
                      <Badge variant={flag.severity === 'critical' || flag.severity === 'high' ? 'destructive' : 'secondary'}>
                        {flag.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cognitive Tab */}
        <TabsContent value="cognitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cognitive Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Construction Style</h4>
                  <Badge variant={analysis.cognitive_analysis.incremental_construction ? 'default' : 'secondary'}>
                    {analysis.cognitive_analysis.incremental_construction ? 'Incremental' : 'All-at-once'}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Troubleshooting Style</h4>
                  <Badge variant={
                    analysis.cognitive_analysis.troubleshooting_style === 'systematic' ? 'default' :
                    analysis.cognitive_analysis.troubleshooting_style === 'erratic' ? 'destructive' :
                    'secondary'
                  }>
                    {analysis.cognitive_analysis.troubleshooting_style}
                  </Badge>
                </div>
              </div>

              {analysis.cognitive_analysis.mastery_indicators.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Mastery Indicators</h4>
                  <ul className="space-y-1">
                    {analysis.cognitive_analysis.mastery_indicators.map((indicator, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pivotal Moments */}
          {analysis.cognitive_analysis.pivotal_moments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pivotal Moments</CardTitle>
                <CardDescription>Key decision points and conceptual shifts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.cognitive_analysis.pivotal_moments.map((moment, index) => (
                    <div key={index} className="p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {behavioralAnalysisService.formatDuration(moment.timestamp / 1000)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {moment.deletion_count} deletions
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {moment.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Struggle Areas */}
          {analysis.cognitive_analysis.struggle_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Struggle Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.cognitive_analysis.struggle_areas.map((area, index) => (
                    <div key={index} className="p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {behavioralAnalysisService.formatDuration(area.timestamp / 1000)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {area.duration.toFixed(1)}s duration
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {area.indicator}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pedagogical Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.pedagogical_feedback.narrative && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm">{analysis.pedagogical_feedback.narrative}</p>
                </div>
              )}

              {analysis.pedagogical_feedback.struggle_concepts?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Struggle Concepts</h4>
                  <ul className="space-y-2">
                    {analysis.pedagogical_feedback.struggle_concepts.map((concept, index) => (
                      <li key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/10 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.pedagogical_feedback.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysis.pedagogical_feedback.recommendations.filter(Boolean).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/10 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component
function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
