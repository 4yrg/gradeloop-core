"use client";

import { use, useState } from "react";
import {
    ArrowLeft,
    ChevronRight,
    MessageCircle,
    Send,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../../../../../../components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";
import { Textarea } from "../../../../../../../../components/ui/textarea";
import { Badge } from "../../../../../../../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../../../../../../../components/ui/alert";

export default function RegradePage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const [reason, setReason] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-2xl mx-auto px-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Send className="h-16 w-16 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Request Submitted</h1>
                    <p className="text-muted-foreground">
                        Your regrade request has been sent to the instructor. You will be notified once it is reviewed.
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/history`}>
                        Back to Submission History
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-3xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/history`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to History
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold tracking-tight">Request Regrade</h1>
                <p className="text-muted-foreground">
                    Submit a formal appeal if you believe there was an error in the grading of your submission.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Appeal Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Reason for Request</label>
                                <Select value={reason} onValueChange={setReason} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a reason..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="clerical">Clerical Error / Calculation Mistake</SelectItem>
                                        <SelectItem value="rubric">Rubric Interpretation Concern</SelectItem>
                                        <SelectItem value="technical">Technical Issue with Auto-Grader</SelectItem>
                                        <SelectItem value="viva">Viva / Oral Evaluation Discrepancy</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detailed Explanation</label>
                                <Textarea
                                    placeholder="Explain why you are requesting a regrade. Reference specific test cases or rubric items..."
                                    className="min-h-[200px]"
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Be professional and specific. Attachments can be added after submission.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Reference Submission</label>
                                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">#3</Badge>
                                        <span className="text-sm font-medium">Jan 04, 2024 (Score: 85/100)</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <Alert variant="default" className="bg-primary/5 border-primary/20">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-primary">Important Note</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Regrade requests may result in your score increasing, decreasing, or remaining the same. All decisions by the instructor are final.
                                </AlertDescription>
                            </Alert>

                            <Button type="submit" className="w-full h-12">
                                Submit Regrade Request
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            Request Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Current Status</p>
                                    <p className="text-xs text-muted-foreground">No active requests for this assignment.</p>
                                </div>
                                <Badge variant="secondary">None</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
