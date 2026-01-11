'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  Keyboard,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';
import {
  keystrokeAnalyticsService,
  type KeystrokeEvent,
  type StudentKeystrokeSummary
} from '@/lib/keystroke-analytics-service';

interface KeystrokeAnalyticsTabProps {
  studentId: string;
  assignmentId: string;
}

export function KeystrokeAnalyticsTab({ studentId, assignmentId }: KeystrokeAnalyticsTabProps) {
  const [summary, setSummary] = useState<StudentKeystrokeSummary | null>(null);
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [summaryData, eventsData] = await Promise.all([
          keystrokeAnalyticsService.getStudentAssignmentSummary(studentId, assignmentId),
          keystrokeAnalyticsService.getStudentAssignmentEvents(studentId, assignmentId)
        ]);

        setSummary(summaryData);
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load keystroke analytics');
      } finally {
        setLoading(false);
      }
    }

    if (studentId && assignmentId) {
      loadData();
    }
  }, [studentId, assignmentId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">{error || 'No authentication data available'}</p>
        <p className="text-xs mt-2">
          Auth analytics will appear here once the student submits with keystroke monitoring enabled
        </p>
      </div>
    );
  }

  const riskColor = keystrokeAnalyticsService.getRiskLevelColor(summary.riskLevel);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
              <Badge variant="outline" className={riskColor}>
                Risk Level
              </Badge>
              <span className="text-3xl font-bold">{summary.riskLevel}</span>
              <p className="text-xs text-muted-foreground">
                Based on {summary.totalEvents} events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
              <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/5">
                Avg Confidence
              </Badge>
              <span className={`text-3xl font-bold ${keystrokeAnalyticsService.getConfidenceColor(summary.averageConfidence)}`}>
                {summary.averageConfidence.toFixed(1)}%
              </span>
              <Progress value={summary.averageConfidence} className="h-1 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
              <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/5">
                Risk Score
              </Badge>
              <span className="text-3xl font-bold">
                {summary.averageRiskScore.toFixed(1)}%
              </span>
              <Progress
                value={summary.averageRiskScore}
                className="h-1 w-full [&>div]:bg-orange-500"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
              <Badge variant="outline" className={summary.suspiciousEvents > 0 ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-green-500 border-green-500/20 bg-green-500/5"}>
                Suspicious Events
              </Badge>
              <span className="text-3xl font-bold">
                {summary.suspiciousEvents}
              </span>
              <p className="text-xs text-muted-foreground">
                {((summary.suspiciousEvents / summary.totalEvents) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Confidence Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Minimum</span>
                <span className={`font-mono font-bold ${keystrokeAnalyticsService.getConfidenceColor(summary.minConfidence)}`}>
                  {summary.minConfidence.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Average</span>
                <span className={`font-mono font-bold ${keystrokeAnalyticsService.getConfidenceColor(summary.averageConfidence)}`}>
                  {summary.averageConfidence.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Maximum</span>
                <span className={`font-mono font-bold ${keystrokeAnalyticsService.getConfidenceColor(summary.maxConfidence)}`}>
                  {summary.maxConfidence.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">First Event</span>
                <span className="text-xs font-mono">
                  {summary.firstEventTime
                    ? new Date(summary.firstEventTime).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Last Event</span>
                <span className="text-xs font-mono">
                  {summary.lastEventTime
                    ? new Date(summary.lastEventTime).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total Events</span>
                <span className="text-xs font-mono font-bold">
                  {summary.totalEvents}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning for suspicious activity */}
        {summary.suspiciousEvents > 0 && (
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-500">Suspicious Activity Detected</p>
              <p className="text-xs text-muted-foreground">
                {summary.suspiciousEvents} authentication event{summary.suspiciousEvents !== 1 ? 's' : ''} with high risk scores detected.
                Review the event timeline below for details.
              </p>
            </div>
          </div>
        )}

        {/* Recent Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Authentication Events Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No authentication events recorded
              </p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 10).map((event, index) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 p-3 rounded-md border ${
                      event.riskScore > 50 ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {event.authenticated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {keystrokeAnalyticsService.formatRelativeTime(event.eventTimestamp)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${event.riskScore > 50 ? 'border-red-500/50 text-red-500' : ''}`}
                        >
                          Risk: {event.riskScore.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className={`ml-1 font-bold ${keystrokeAnalyticsService.getConfidenceColor(event.confidenceLevel)}`}>
                            {event.confidenceLevel.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Similarity:</span>
                          <span className="ml-1 font-mono">
                            {event.similarityScore.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sample:</span>
                          <span className="ml-1 font-mono flex items-center gap-1">
                            <Keyboard className="h-3 w-3" />
                            {event.keystrokeSampleSize}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {events.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Showing 10 of {events.length} events
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Status Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Understanding Auth Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p><strong>Confidence Level:</strong> How certain the system is about the user's identity (higher is better)</p>
            <p><strong>Risk Score:</strong> Likelihood of impersonation or suspicious behavior (lower is better)</p>
            <p><strong>Similarity Score:</strong> How closely keystroke patterns match the enrolled template</p>
            <p><strong>Sample Size:</strong> Number of keystroke events analyzed for this verification</p>
            <div className="flex gap-4 pt-2">
              <span className="text-green-500">● Authenticated</span>
              <span className="text-yellow-500">● Medium Risk</span>
              <span className="text-red-500">● High Risk</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
