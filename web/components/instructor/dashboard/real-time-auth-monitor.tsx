'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Users,
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { Progress } from '../../ui/progress';
import {
  keystrokeAnalyticsService,
  type KeystrokeEvent
} from '@/lib/keystroke-analytics-service';

interface RealTimeAuthMonitorProps {
  assignmentId: string;
  refreshInterval?: number; // milliseconds
}

interface ActiveSession {
  studentId: string;
  latestEvent: KeystrokeEvent;
  eventCount: number;
  averageConfidence: number;
  averageRisk: number;
  lastUpdate: Date;
}

export function RealTimeAuthMonitor({
  assignmentId,
  refreshInterval = 5000
}: RealTimeAuthMonitorProps) {
  const [sessions, setSessions] = useState<Map<string, ActiveSession>>(new Map());
  const [recentEvents, setRecentEvents] = useState<AuthEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchLatestEvents = useCallback(async () => {
    try {
      const events = await keystrokeAnalyticsService.getAssignmentEvents(assignmentId);

      // Get events from the last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentEventsData = events.filter(
        (event) => new Date(event.eventTimestamp) > tenMinutesAgo
      );

      setRecentEvents(recentEventsData.slice(0, 20));

      // Group by student to create active sessions
      const sessionMap = new Map<string, ActiveSession>();

      recentEventsData.forEach((event) => {
        const existing = sessionMap.get(event.studentId);

        if (existing) {
          const totalConfidence =
            existing.averageConfidence * existing.eventCount + event.confidenceLevel;
          const totalRisk = existing.averageRisk * existing.eventCount + event.riskScore;
          const newCount = existing.eventCount + 1;

          sessionMap.set(event.studentId, {
            studentId: event.studentId,
            latestEvent: event,
            eventCount: newCount,
            averageConfidence: totalConfidence / newCount,
            averageRisk: totalRisk / newCount,
            lastUpdate: new Date(event.eventTimestamp)
          });
        } else {
          sessionMap.set(event.studentId, {
            studentId: event.studentId,
            latestEvent: event,
            eventCount: 1,
            averageConfidence: event.confidenceLevel,
            averageRisk: event.riskScore,
            lastUpdate: new Date(event.eventTimestamp)
          });
        }
      });

      setSessions(sessionMap);
      setLastRefresh(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchLatestEvents();
  }, [fetchLatestEvents]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      fetchLatestEvents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval, fetchLatestEvents]);

  const stats = {
    activeSessions: sessions.size,
    totalEvents: recentEvents.length,
    highRiskCount: Array.from(sessions.values()).filter((s) => s.averageRisk >= 50).length,
    averageConfidence:
      sessions.size > 0
        ? Array.from(sessions.values()).reduce((sum, s) => sum + s.averageConfidence, 0) /
          sessions.size
        : 0
  };

  const sortedSessions = Array.from(sessions.values()).sort(
    (a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime()
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Real-Time Auth Monitor</h2>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isLive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            <Zap className={`h-4 w-4 mr-2 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLatestEvents}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <Users className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-3xl font-bold">{stats.activeSessions}</span>
            <p className="text-xs text-muted-foreground">Active Sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <Activity className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-3xl font-bold">{stats.totalEvents}</span>
            <p className="text-xs text-muted-foreground">Recent Events (10min)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-3xl font-bold">{stats.averageConfidence.toFixed(1)}%</span>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <span className="text-3xl font-bold">{stats.highRiskCount}</span>
            <p className="text-xs text-muted-foreground">High Risk Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Sessions
            {isLive && (
              <Badge variant="outline" className="ml-auto text-green-500 border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20 animate-pulse" />
              <p>Loading sessions...</p>
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active sessions in the last 10 minutes</p>
              <p className="text-xs mt-2">Sessions will appear here as students work</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {sortedSessions.map((session) => (
                  <Card
                    key={session.studentId}
                    className={
                      session.averageRisk >= 50
                        ? 'border-red-500/20 bg-red-500/5'
                        : session.averageConfidence >= 80
                        ? 'border-green-500/20 bg-green-500/5'
                        : ''
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {session.studentId.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{session.studentId}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.eventCount} events •{' '}
                              {keystrokeAnalyticsService.formatRelativeTime(
                                session.lastUpdate.toISOString()
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            session.latestEvent.authenticated
                              ? 'text-green-500 border-green-500/20'
                              : 'text-red-500 border-red-500/20'
                          }
                        >
                          {session.latestEvent.authenticated ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {session.latestEvent.authenticated ? 'Authenticated' : 'Failed'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Confidence</span>
                            <span
                              className={`font-bold ${keystrokeAnalyticsService.getConfidenceColor(
                                session.averageConfidence
                              )}`}
                            >
                              {session.averageConfidence.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={session.averageConfidence} className="h-1" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Risk Score</span>
                            <span className="font-bold">
                              {session.averageRisk.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={session.averageRisk}
                            className="h-1 [&>div]:bg-orange-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {event.authenticated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">{event.studentId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          event.riskScore > 50 ? 'border-red-500/50 text-red-500' : ''
                        }`}
                      >
                        {event.riskScore.toFixed(0)}%
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {keystrokeAnalyticsService.formatRelativeTime(event.eventTimestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
