'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    User, 
    Calendar, 
    Clock, 
    ShieldAlert, 
    CheckCircle2,
    AlertTriangle,
    FileCode,
    History
} from 'lucide-react';
import { Button } from '../../../../../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../../components/ui/card';
import { Badge } from '../../../../../../../../../components/ui/badge';
import { Separator } from '../../../../../../../../../components/ui/separator';
import { ScrollArea } from '../../../../../../../../../components/ui/scroll-area';
import { SessionPlayback } from '../../../../../../../../../components/instructor/session-playback';
import { KeystrokeTimeline } from '../../../../../../../../../components/instructor/keystroke-timeline';
import { getSubmissionByStudentId } from '../../../../../../../../../lib/mock-submissions-data';
import { formatDistanceToNow, format } from 'date-fns';

export default function StudentSubmissionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const assignmentId = params.assignmentId as string;
    const studentId = params.studentId as string;

    const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
    const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

    // Get student submission data
    const studentSubmission = getSubmissionByStudentId(studentId);

    if (!studentSubmission) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <AlertTriangle className="h-16 w-16 text-yellow-500" />
                <h2 className="text-2xl font-bold">Submission Not Found</h2>
                <p className="text-muted-foreground">Unable to find submission for student ID: {studentId}</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const selectedAttempt = studentSubmission.attempts[selectedAttemptIndex];
    const attemptDuration = selectedAttempt.keystrokeData[selectedAttempt.keystrokeData.length - 1]?.timestamp || 600;

    const getStatusColor = (status: string) => {
        if (status === 'Graded') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'Ungraded') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    const getIntegrityColor = (score: number) => {
        if (score >= 70) return 'text-emerald-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getIntegrityBadge = (score: number) => {
        if (score >= 70) return { label: 'High Confidence', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
        if (score >= 50) return { label: 'Moderate', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
        return { label: 'Low Confidence', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    };

    return (
        <div className="flex flex-col gap-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <User className="h-8 w-8 text-muted-foreground" />
                            {studentSubmission.studentName}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Student ID: {studentSubmission.studentId} • {studentSubmission.attempts.length} attempt{studentSubmission.attempts.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" className={getStatusColor(studentSubmission.status)}>
                            {studentSubmission.status}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Latest Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {studentSubmission.latestScore}
                            <span className="text-lg text-muted-foreground">/100</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Integrity Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className={`text-3xl font-bold ${getIntegrityColor(studentSubmission.overallIntegrityScore)}`}>
                                {studentSubmission.overallIntegrityScore}%
                            </span>
                            {studentSubmission.overallIntegrityScore < 50 && (
                                <ShieldAlert className="h-6 w-6 text-red-500" />
                            )}
                        </div>
                        <Badge 
                            variant="outline" 
                            className={`mt-2 ${getIntegrityBadge(studentSubmission.overallIntegrityScore).color}`}
                        >
                            {getIntegrityBadge(studentSubmission.overallIntegrityScore).label}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Last Updated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                                {formatDistanceToNow(new Date(selectedAttempt.timestamp), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(selectedAttempt.timestamp), 'PPp')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar: Submission History */}
                <Card className="lg:col-span-1">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Submission History
                        </CardTitle>
                        <CardDescription>
                            {studentSubmission.attempts.length} attempt{studentSubmission.attempts.length > 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            <div className="p-4 space-y-2">
                                {studentSubmission.attempts.map((attempt, index) => (
                                    <div
                                        key={attempt.id}
                                        onClick={() => setSelectedAttemptIndex(index)}
                                        className={`
                                            p-4 rounded-lg border-2 cursor-pointer transition-all
                                            ${selectedAttemptIndex === index 
                                                ? 'border-primary bg-primary/5' 
                                                : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">Attempt {index + 1}</span>
                                            <Badge variant="outline" className={getStatusColor(attempt.status)}>
                                                {attempt.status}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                <span>{format(new Date(attempt.timestamp), 'MMM dd, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                <span>{format(new Date(attempt.timestamp), 'HH:mm')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileCode className="h-3 w-3" />
                                                <span>Score: {attempt.score}/100</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="h-3 w-3" />
                                                <span className={getIntegrityColor(attempt.integrityScore)}>
                                                    Integrity: {attempt.integrityScore}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Main Content: Playback & Timeline */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Session Playback */}
                    <SessionPlayback
                        code={selectedAttempt.code}
                        language={selectedAttempt.language}
                        duration={attemptDuration}
                        onTimeChange={setCurrentPlaybackTime}
                    />

                    {/* Keystroke Auth Timeline */}
                    <KeystrokeTimeline
                        data={selectedAttempt.keystrokeData}
                        currentTime={currentPlaybackTime}
                        duration={attemptDuration}
                    />

                    {/* Integrity Analysis Summary */}
                    {selectedAttempt.integrityScore < 50 && (
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <ShieldAlert className="h-5 w-5" />
                                    Integrity Alert
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    This submission has been flagged due to a low keystroke authentication confidence score.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                        Abnormal typing patterns detected
                                    </Badge>
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                        Inconsistent with baseline behavior
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                        Schedule Viva
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                        Compare with Previous Attempts
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                        Flag for Review
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedAttempt.integrityScore >= 70 && (
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Healthy Authentication Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Keystroke patterns are consistent with the student's baseline behavior. No integrity concerns detected.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
