"use client";

import { use } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Code,
    Download,
    ExternalLink,
    FileJson,
    MoreHorizontal,
    RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_ASSIGNMENTS } from "@/features/student/assignments/data/mock-assignments";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const MOCK_SUBMISSIONS = [
    { id: '1', number: 3, time: '2024-01-04 10:45 AM', language: 'Python', status: 'Graded', score: 85, total: 100 },
    { id: '2', number: 2, time: '2024-01-03 09:12 PM', language: 'Python', status: 'Graded', score: 60, total: 100 },
    { id: '3', number: 1, time: '2024-01-02 11:30 AM', language: 'Python', status: 'Failed', score: 0, total: 100 },
];

export default function HistoryPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);

    if (!assignment) return <div>Assignment not found</div>;

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignment
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold tracking-tight">Submission History</h1>
                    <Button variant="outline" size="sm">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    Showing all submissions for <span className="font-bold text-foreground">{assignment.title}</span>.
                </p>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[100px]">Submission</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_SUBMISSIONS.map((sub) => (
                            <TableRow key={sub.id} className="group transition-colors">
                                <TableCell className="font-bold">#{sub.number}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{sub.time}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono text-[10px]">{sub.language}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={sub.status === 'Graded' ? "secondary" : "destructive"}
                                        className={sub.status === 'Graded' ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200" : ""}
                                    >
                                        {sub.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {sub.status === 'Graded' ? (
                                        <span className={sub.score > 70 ? "text-green-600" : "text-amber-600"}>
                                            {sub.score}/{sub.total}
                                        </span>
                                    ) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/results/${sub.id}`}>
                                                View Results
                                            </Link>
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Code className="mr-2 h-4 w-4" />
                                                    View Code
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    View Full Logs
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <FileJson className="mr-2 h-4 w-4" />
                                                    Export as JSON
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-primary font-medium">
                                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                                    Compare with current
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-muted/30 border-2 border-dashed rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Total attempts allowed: <span className="font-bold text-foreground">{assignment.totalAttempts}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    Best score is used for final calculation.
                </p>
            </div>
        </div>
    );
}
