"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import {
    History,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    Terminal
} from "lucide-react";
import { Assignment } from "../data/mock-assignments";
import { MOCK_SUBMISSIONS, SubmissionStatus } from "../data/mock-submissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { cn } from "../../../../lib/utils";
import { Input } from "../../../../components/ui/input";
import Link from "next/link";

interface SubmissionHistoryDialogProps {
    assignment: Assignment;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const getStatusStyles = (status: SubmissionStatus) => {
    switch (status) {
        case 'accepted':
            return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
        case 'wrong_answer':
        case 'runtime_error':
        case 'compilation_error':
            return "bg-destructive/10 text-destructive border-destructive/20";
        case 'time_limit_exceeded':
        case 'memory_limit_exceeded':
            return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        case 'pending':
            return "bg-muted text-muted-foreground border-muted-foreground/20";
        default:
            return "";
    }
};

const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
        case 'accepted':
            return <CheckCircle2 className="h-4 w-4" />;
        case 'wrong_answer':
        case 'runtime_error':
        case 'compilation_error':
            return <XCircle className="h-4 w-4" />;
        case 'time_limit_exceeded':
        case 'memory_limit_exceeded':
            return <Clock className="h-4 w-4" />;
        default:
            return <Terminal className="h-4 w-4" />;
    }
};

export function SubmissionHistoryDialog({ assignment, children, open, onOpenChange }: SubmissionHistoryDialogProps) {
    const submissions = MOCK_SUBMISSIONS.filter(s => s.assignmentId === assignment.id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-muted/30 border-b shrink-0">
                    <div className="flex flex-col gap-2">
                        <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <History className="h-6 w-6 text-primary" />
                            Submission History
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            {assignment.title} • {submissions.length} total attempts
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="p-4 border-b bg-muted/10 shrink-0 flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search submissions..." className="pl-9 h-9 bg-background" />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 overflow-y-auto">
                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Status</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Score</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider px-4">Language</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Runtime / Memory</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-wider">Timestamp</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.length > 0 ? (
                                        submissions.map((sub) => (
                                            <TableRow key={sub.id} className="group hover:bg-muted/30 transition-colors pointer-cursor">
                                                <TableCell className="pl-6 py-4">
                                                    <Badge variant="outline" className={cn("gap-2 font-bold uppercase text-[10px] pr-3", getStatusStyles(sub.status))}>
                                                        {getStatusIcon(sub.status)}
                                                        {sub.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn("font-black", sub.score === sub.totalScore ? "text-primary" : "text-foreground")}>
                                                            {sub.score}
                                                        </span>
                                                        <span className="text-muted-foreground font-medium">/</span>
                                                        <span className="text-muted-foreground font-medium">{sub.totalScore}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <Badge variant="secondary" className="font-semibold text-[10px]">{sub.language}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5 text-[11px] font-mono text-muted-foreground">
                                                        <span>{sub.runtime || '--'}</span>
                                                        <span>{sub.memory || '--'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground font-medium">
                                                    {new Date(sub.timestamp).toLocaleDateString()} at{' '}
                                                    {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="pr-6">
                                                    <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors" asChild>
                                                        <Link href={`/student/courses/${assignment.courseId}/assignments/${assignment.id}/workspace?submissionId=${sub.id}`}>
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
                                                No submissions yet for this assignment.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 bg-muted/10 border-t shrink-0 flex flex-row items-center justify-between gap-4">
                    <div className="text-[11px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Next Deadline: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                    <Button onClick={() => onOpenChange?.(false)} variant="outline" className="px-8">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
