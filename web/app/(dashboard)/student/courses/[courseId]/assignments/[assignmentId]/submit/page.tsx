"use client";

import { use, useState } from "react";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Code2,
    Info,
    ShieldAlert,
    Mic,
    PlayCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ASSIGNMENTS } from "@/features/student/assignments/data/mock-assignments";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SubmissionPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!assignment) return <div>Assignment not found</div>;

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 2000);
    };

    if (submitted) {
        const hasViva = assignment.vivaEnabled;
        const vivaRequired = assignment.vivaRequired;
        const vivaWeight = assignment.vivaWeight || 0;

        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center max-w-2xl mx-auto px-4">
                <div className="bg-green-500/10 p-6 rounded-full">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Submission Successful!</h1>
                    <p className="text-muted-foreground text-lg">
                        Your work has been received and added to the grading queue.
                    </p>
                </div>

                {hasViva && (
                    <div className="w-full max-w-md">
                        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                            <Mic className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800 dark:text-blue-200">
                                Viva Assessment {vivaRequired ? 'Required' : 'Available'}
                            </AlertTitle>
                            <AlertDescription className="text-blue-700 dark:text-blue-300">
                                {vivaRequired ? 
                                    `Complete your viva assessment to finalize your grade. It contributes ${vivaWeight}% to your final score.` :
                                    `Optional viva assessment available. It can contribute up to ${vivaWeight}% to your final score.`
                                }
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 w-full mt-4">
                    <Button asChild variant="outline" className="flex-1">
                        <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/history`}>
                            View Submission History
                        </Link>
                    </Button>
                    {hasViva && (
                        <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/viva`}>
                                <Mic className="mr-2 h-4 w-4" />
                                Start Viva Assessment
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline" className="flex-1">
                        <Link href={`/student/courses/${courseId}/assignments`}>
                            Back to Courses
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-4xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/workspace`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Workspace
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold tracking-tight">Review Submission</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Code Snapshot</CardTitle>
                            <Badge variant="secondary" className="font-mono">python</Badge>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] w-full rounded-md border bg-zinc-950 p-4">
                                <pre className="text-xs font-mono text-zinc-300">
                                    {`import sys\n\ndef main():\n    # Example submitted code\n    print("Hello World")\n    \nif __name__ == "__main__":\n    main()`}
                                </pre>
                            </ScrollArea>
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Snapshot taken: 2024-01-04 10:45 AM</span>
                                <span>Lines: 12</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg">Submission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Attempts Left</span>
                                <span className="font-bold">{assignment.attemptsRemaining} / {assignment.totalAttempts}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Late Penalty</span>
                                <span className="text-green-600 font-medium">None (On Time)</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Grading Policy</span>
                                <span className="font-medium">{assignment.gradingMethod}</span>
                            </div>
                            {assignment.vivaEnabled && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mic className="h-4 w-4 text-blue-600" />
                                            <span className="text-muted-foreground">Viva Assessment</span>
                                            <Badge variant={assignment.vivaRequired ? "default" : "secondary"} className="text-xs">
                                                {assignment.vivaRequired ? "Required" : "Optional"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {assignment.vivaRequired ? 
                                                `Oral examination required. Contributes ${assignment.vivaWeight}% to final grade.` :
                                                `Optional oral assessment available. Can contribute up to ${assignment.vivaWeight}% to final grade.`
                                            }
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-bold uppercase tracking-wider text-[10px]">Irreversible Action</AlertTitle>
                        <AlertDescription className="text-xs">
                            Once confirmed, this submission cannot be deleted. If you have attempts remaining, you can resubmit before the deadline.
                        </AlertDescription>
                    </Alert>

                    <Button
                        className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processing..." : "Confirm & Submit"}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                        By clicking confirm, you certify that this is your own work.
                    </p>
                </div>
            </div>
        </div>
    );
}
