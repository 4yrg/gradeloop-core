"use client";

import { use, useState } from "react";
import { ChevronRight, FileCode, HelpCircle, History, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/features/student/assignments/components/countdown-timer";
import { StatusBadge } from "@/features/student/assignments/components/status-badge";
import { MOCK_ASSIGNMENTS, Assignment } from "@/features/student/assignments/data/mock-assignments";
import { Badge } from "@/components/ui/badge";
import { AssignmentDetailsDialog } from "@/features/student/assignments/components/assignment-details-dialog";
import { SubmissionHistoryDialog } from "@/features/student/assignments/components/submission-history-dialog";

export default function StudentAssignmentsPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    // Filter assignments for this course
    const assignments = MOCK_ASSIGNMENTS.filter(a => a.courseId === courseId || true);

    const handleOpenDetails = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setDetailsOpen(true);
    };

    const handleOpenHistory = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setHistoryOpen(true);
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-6xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/student" className="hover:text-primary transition-colors">Courses</Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link href={`/student/courses/${courseId}`} className="hover:text-primary transition-colors">Course: {courseId}</Link>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Assignments</h1>
                <p className="text-muted-foreground">
                    Understand your requirements, track deadlines, and submit your work.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {assignments.map((assignment) => (
                    <Card key={assignment.id} className="overflow-hidden border-2 transition-all hover:border-primary/50">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <StatusBadge status={assignment.status} />
                                        <Badge variant="outline">{assignment.gradingMethod} Grading</Badge>
                                        {assignment.difficulty && (
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase">{assignment.difficulty}</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-2xl mt-2 cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenDetails(assignment)}>
                                        {assignment.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1">
                                        {assignment.latePolicy}
                                    </CardDescription>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-medium mb-1">Due in</p>
                                    <CountdownTimer deadline={assignment.dueDate} className="text-lg font-bold text-foreground" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Languages</p>
                                    <div className="flex flex-wrap gap-1">
                                        {assignment.allowedLanguages.map(lang => (
                                            <Badge key={lang} variant="secondary" className="text-[10px]">{lang}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Time Limit</p>
                                    <p className="text-sm font-medium">{assignment.timeLimit}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Memory Limit</p>
                                    <p className="text-sm font-medium">{assignment.memoryLimit}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Attempts</p>
                                    <p className="text-sm font-medium">{assignment.attemptsRemaining} / {assignment.totalAttempts} left</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/10 border-t flex flex-wrap gap-2 justify-between py-4">
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => handleOpenDetails(assignment)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    {assignment.status === 'not_started' ? 'Start Assignment' : 'Continue Assignment'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleOpenHistory(assignment)}>
                                    <History className="mr-2 h-4 w-4" />
                                    View Submissions
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                Ask for Help
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {selectedAssignment && (
                <>
                    <AssignmentDetailsDialog
                        assignment={selectedAssignment}
                        open={detailsOpen}
                        onOpenChange={setDetailsOpen}
                    />
                    <SubmissionHistoryDialog
                        assignment={selectedAssignment}
                        open={historyOpen}
                        onOpenChange={setHistoryOpen}
                    />
                </>
            )}
        </div>
    );
}
