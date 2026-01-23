'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  User,
  FileText,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import {
  keystrokeAnalyticsService,
  type KeystrokeEvent
} from '@/lib/keystroke-analytics-service';

interface SuspiciousSubmissionsDashboardProps {
  assignmentId: string;
}

interface GroupedSuspiciousEvent extends KeystrokeEvent {
  studentName?: string;
}

export function SuspiciousSubmissionsDashboard({
  assignmentId
}: SuspiciousSubmissionsDashboardProps) {
  const [suspiciousEvents, setSuspiciousEvents] = useState<GroupedSuspiciousEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<GroupedSuspiciousEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  useEffect(() => {
    async function loadSuspiciousEvents() {
      try {
        setLoading(true);
        setError(null);

        const events = await keystrokeAnalyticsService.getSuspiciousEvents(assignmentId);
        setSuspiciousEvents(events);
        setFilteredEvents(events);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suspicious events');
      } finally {
        setLoading(false);
      }
    }

    if (assignmentId) {
      loadSuspiciousEvents();
    }
  }, [assignmentId]);

  // Filter events based on search and risk level
  useEffect(() => {
    let filtered = suspiciousEvents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk filter
    if (riskFilter !== 'all') {
      const threshold = riskFilter === 'high' ? 70 : riskFilter === 'medium' ? 50 : 0;
      const maxThreshold = riskFilter === 'high' ? 100 : riskFilter === 'medium' ? 70 : 50;
      filtered = filtered.filter(
        (event) => event.riskScore >= threshold && event.riskScore < maxThreshold
      );
    }

    setFilteredEvents(filtered);
  }, [searchTerm, riskFilter, suspiciousEvents]);

  // Calculate statistics
  const stats = {
    totalSuspicious: suspiciousEvents.length,
    highRisk: suspiciousEvents.filter((e) => e.riskScore >= 70).length,
    mediumRisk: suspiciousEvents.filter((e) => e.riskScore >= 50 && e.riskScore < 70).length,
    uniqueStudents: new Set(suspiciousEvents.map((e) => e.studentId)).size
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Timestamp', 'Risk Score', 'Confidence', 'Sample Size', 'Authenticated'];
    const rows = filteredEvents.map((event) => [
      event.studentId,
      new Date(event.eventTimestamp).toISOString(),
      event.riskScore.toFixed(2),
      event.confidenceLevel.toFixed(2),
      event.keystrokeSampleSize,
      event.authenticated ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suspicious-events-${assignmentId}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <span className="text-3xl font-bold">{stats.totalSuspicious}</span>
            <p className="text-xs text-muted-foreground">Total Suspicious Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5 mb-2">
              High Risk
            </Badge>
            <span className="text-3xl font-bold">{stats.highRisk}</span>
            <p className="text-xs text-muted-foreground">Risk Score 70%+</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5 mb-2">
              Medium Risk
            </Badge>
            <span className="text-3xl font-bold">{stats.mediumRisk}</span>
            <p className="text-xs text-muted-foreground">Risk Score 50-70%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
            <User className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-3xl font-bold">{stats.uniqueStudents}</span>
            <p className="text-xs text-muted-foreground">Affected Students</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Suspicious Authentication Events
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student ID or session..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk (70%+)</SelectItem>
                <SelectItem value="medium">Medium Risk (50-70%)</SelectItem>
                <SelectItem value="low">Low Risk (Below 50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No suspicious events found</p>
              <p className="text-xs mt-2">
                {searchTerm || riskFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'All submissions appear to have normal authentication patterns'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Sample Size</TableHead>
                    <TableHead>Auth Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className={event.riskScore >= 70 ? 'bg-red-500/5' : ''}
                    >
                      <TableCell className="font-mono text-xs">
                        {event.studentId}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(event.eventTimestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            event.riskScore >= 70
                              ? 'text-red-500 border-red-500/20 bg-red-500/5'
                              : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5'
                          }
                        >
                          {event.riskScore.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-mono ${keystrokeAnalyticsService.getConfidenceColor(
                            event.confidenceLevel
                          )}`}
                        >
                          {event.confidenceLevel.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {event.keystrokeSampleSize}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.authenticated ? 'outline' : 'destructive'}
                          className="text-[10px]"
                        >
                          {event.authenticated ? 'Pass' : 'Fail'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {stats.highRisk > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>Review high-risk events:</strong> Manually review submissions from students
              with multiple high-risk authentication events
            </p>
            <p>
              • <strong>Contact affected students:</strong> Reach out to students with suspicious
              patterns to verify submission authenticity
            </p>
            <p>
              • <strong>Consider re-assessment:</strong> For students with persistent high-risk
              scores, consider requesting a live demonstration or re-submission
            </p>
            <p>
              • <strong>Monitor patterns:</strong> Watch for recurring patterns across multiple
              assignments that may indicate systemic issues
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
