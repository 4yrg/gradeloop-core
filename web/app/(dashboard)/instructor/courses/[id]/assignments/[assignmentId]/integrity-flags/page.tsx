'use client';

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Flag,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    ArrowRight,
    User,
    Clock,
    Zap
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../components/ui/badge";
import { ScrollArea } from "../../../../../../../../components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";
import { Input } from "../../../../../../../../components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../../../../../../../components/ui/table";
import { getFlaggedSubmissions } from "../../../../../../../../lib/mock-submissions-data";
import { formatDistanceToNow } from "date-fns";

export default function IntegrityFlagsPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const [searchTerm, setSearchTerm] = useState("");
    
    // Get flagged submissions (integrity score < 50)
    const flaggedSubmissions = getFlaggedSubmissions();

    const filteredSubmissions = flaggedSubmissions.filter(submission =>
        submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRowClick = (studentId: string) => {
        router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`);
    };

    const getIntegrityLevel = (score: number) => {
        if (score < 40) return { label: "Critical", color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20" };
        return { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    };

    // Calculate stats
    const criticalFlags = flaggedSubmissions.filter(s => s.overallIntegrityScore < 40).length;
    const mediumFlags = flaggedSubmissions.length - criticalFlags;

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Integrity Flags</h2>
                    <p className="text-muted-foreground">Review submissions with low keystroke authentication scores (&lt; 50%)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Download Report</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{flaggedSubmissions.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">{criticalFlags} Critical • {mediumFlags} Medium</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Critical</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{criticalFlags}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Score &lt; 40%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Medium</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">{mediumFlags}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Score 40-49%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Behavioral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{flaggedSubmissions.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Abnormal typing patterns</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="border-b bg-muted/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Flags Queue</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search students..." 
                                    className="pl-8 h-8 w-[200px] text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/5">
                                    <TableHead className="font-bold">Student</TableHead>
                                    <TableHead className="font-bold">Student ID</TableHead>
                                    <TableHead className="font-bold text-center">Risk Level</TableHead>
                                    <TableHead className="font-bold text-center">Integrity Score</TableHead>
                                    <TableHead className="font-bold text-center">Latest Score</TableHead>
                                    <TableHead className="font-bold text-center">Attempts</TableHead>
                                    <TableHead className="font-bold text-center">Last Updated</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.length > 0 ? (
                                    filteredSubmissions.map((submission) => {
                                        const latestAttempt = submission.attempts[submission.attempts.length - 1];
                                        const integrityLevel = getIntegrityLevel(submission.overallIntegrityScore);
                                        
                                        return (
                                            <TableRow 
                                                key={submission.id}
                                                className="cursor-pointer hover:bg-muted/30 transition-colors"
                                                onClick={() => handleRowClick(submission.studentId)}
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {submission.studentName}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {submission.studentId}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`${integrityLevel.bg} ${integrityLevel.color} ${integrityLevel.border}`}
                                                    >
                                                        <ShieldAlert className="h-3 w-3 mr-1" />
                                                        {integrityLevel.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-bold text-lg text-red-500">
                                                            {submission.overallIntegrityScore}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-bold text-lg">
                                                        {submission.latestScore}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">/100</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-mono">
                                                        {submission.attempts.length}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center text-muted-foreground text-sm">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(latestAttempt.timestamp), { addSuffix: true })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRowClick(submission.studentId);
                                                        }}
                                                    >
                                                        Review
                                                        <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12">
                                            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                                            <p className="text-muted-foreground">No integrity flags found - all submissions look good!</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
