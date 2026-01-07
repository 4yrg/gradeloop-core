'use client';

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Search,
    Filter,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    ShieldAlert,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Input } from "../../../../../../../../components/ui/input";
import { Badge } from "../../../../../../../../components/ui/badge";
import { ScrollArea } from "../../../../../../../../components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../../../../../../../components/ui/table";
import { MOCK_STUDENT_SUBMISSIONS } from "../../../../../../../../lib/mock-submissions-data";
import { formatDistanceToNow } from "date-fns";

export default function ManageSubmissionsPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Filter submissions based on search and status
    const filteredSubmissions = MOCK_STUDENT_SUBMISSIONS.filter(submission => {
        const matchesSearch = submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.studentId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || submission.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleRowClick = (studentId: string) => {
        router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            Graded: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            Ungraded: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            Flagged: "bg-red-500/10 text-red-500 border-red-500/20"
        };
        return styles[status as keyof typeof styles] || "";
    };

    const getIntegrityScoreColor = (score: number) => {
        if (score >= 70) return "text-emerald-500";
        if (score >= 50) return "text-yellow-500";
        return "text-red-500";
    };

    // Calculate stats
    const stats = {
        total: MOCK_STUDENT_SUBMISSIONS.length,
        graded: MOCK_STUDENT_SUBMISSIONS.filter(s => s.status === "Graded").length,
        ungraded: MOCK_STUDENT_SUBMISSIONS.filter(s => s.status === "Ungraded").length,
        flagged: MOCK_STUDENT_SUBMISSIONS.filter(s => s.status === "Flagged").length
    };

    return (
        <div className="flex flex-col gap-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">All Submissions</h2>
                    <p className="text-muted-foreground">Review and grade student submissions</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Submissions received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Graded</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-500">{stats.graded}</div>
                        <p className="text-xs text-muted-foreground mt-1">{Math.round((stats.graded / stats.total) * 100)}% complete</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Ungraded</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-500">{stats.ungraded}</div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Flagged</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{stats.flagged}</div>
                        <p className="text-xs text-muted-foreground mt-1">Integrity concerns</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader className="border-b bg-muted/5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by student name or ID..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="graded">Graded</SelectItem>
                                <SelectItem value="ungraded">Ungraded</SelectItem>
                                <SelectItem value="flagged">Flagged</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/5">
                                    <TableHead className="font-bold">Student</TableHead>
                                    <TableHead className="font-bold">Student ID</TableHead>
                                    <TableHead className="font-bold text-center">Attempts</TableHead>
                                    <TableHead className="font-bold text-center">Latest Score</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                    <TableHead className="font-bold text-center">Integrity Score</TableHead>
                                    <TableHead className="font-bold text-center">Last Updated</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.length > 0 ? (
                                    filteredSubmissions.map((submission) => {
                                        const latestAttempt = submission.attempts[submission.attempts.length - 1];
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
                                                    <Badge variant="outline" className="font-mono">
                                                        {submission.attempts.length}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-bold text-lg">
                                                        {submission.latestScore}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">/100</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={getStatusBadge(submission.status)}
                                                    >
                                                        {submission.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className={`font-bold text-lg ${getIntegrityScoreColor(submission.overallIntegrityScore)}`}>
                                                            {submission.overallIntegrityScore}%
                                                        </span>
                                                        {submission.overallIntegrityScore < 50 && (
                                                            <ShieldAlert className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRowClick(submission.studentId);
                                                        }}
                                                    >
                                                        View Details
                                                        <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                            No submissions found matching your criteria
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
