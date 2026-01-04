"use client";

import { use } from "react";
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    Code,
    FileText,
    GraduationCap,
    Info,
    ShieldAlert,
    Table as TableIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ASSIGNMENTS } from "@/features/student/assignments/data/mock-assignments";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AssignmentDetailsPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);

    if (!assignment) {
        return <div>Assignment not found</div>;
    }

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignments
                    </Link>
                </Button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">{assignment.title}</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{assignment.gradingMethod} Grading</Badge>
                            <span className="text-sm text-muted-foreground">Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                        </div>
                    </div>
                    <Button size="lg" asChild className="shadow-lg shadow-primary/20">
                        <Link href={`/student/courses/${courseId}/assignments/${assignment.id}/workspace`}>
                            Open Workspace
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="specs">Specifications</TabsTrigger>
                    <TabsTrigger value="rubric">Rubric</TabsTrigger>
                    <TabsTrigger value="policy">Policies</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Problem Statement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {/* In a real app, use a markdown renderer */}
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {assignment.problemStatement}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4" />
                                    Constraints
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {assignment.constraints.map((c, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Test Cases
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm">
                                    This assignment uses both <span className="font-bold">Visible</span> and <span className="font-bold">Hidden</span> test cases.
                                </p>
                                <Alert variant="default" className="bg-background">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Note on Hidden Cases</AlertTitle>
                                    <AlertDescription>
                                        Hidden test cases are only run during official submission and contribute to your final score.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="specs" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-semibold">
                                <FileText className="h-5 w-5 text-primary" />
                                Input / Output Format
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                                    <p className="font-bold text-primary mb-2">// Input Specification</p>
                                    <p>Standard input should contain the sequence of commands as described in the problem statement...</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                                    <p className="font-bold text-primary mb-2">// Output Specification</p>
                                    <p>Standard output should return the result of each command, one per line...</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    Samples
                                </h3>
                                {assignment.sampleIO.map((sample, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Sample Input {i + 1}</p>
                                            <pre className="p-3 bg-muted border rounded text-xs font-mono">{sample.input}</pre>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Sample Output {i + 1}</p>
                                            <pre className="p-3 bg-muted border rounded text-xs font-mono">{sample.output}</pre>
                                        </div>
                                        {sample.explanation && (
                                            <div className="md:col-span-2 text-sm text-muted-foreground italic">
                                                Explanation: {sample.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rubric" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TableIcon className="h-5 w-5 text-primary" />
                                Scoring Rubric
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Criterion</TableHead>
                                        <TableHead className="text-right">Max Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignment.rubric.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{item.criterion}</TableCell>
                                            <TableCell className="text-right font-bold">{item.points}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell className="font-bold">Total</TableCell>
                                        <TableCell className="text-right font-extrabold text-primary">{assignment.totalScore}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="policy" className="mt-6 space-y-6">
                    <Card className="border-destructive/20 bg-destructive/5 text-destructive-foreground">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <ShieldAlert className="h-5 w-5" />
                                Academic Integrity Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-foreground">
                            <p>
                                By starting this assignment, you agree to the university's academic integrity policy.
                                Plagiarism is strictly prohibited and will be checked using automated tools.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You must not share your code with anyone else.</li>
                                <li>Using AI tools to generate complete solutions is prohibited unless explicitly allowed.</li>
                                <li>All external libraries used must be documented.</li>
                            </ul>
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Consequences</AlertTitle>
                                <AlertDescription>
                                    Violations may result in a zero grade for the assignment and further disciplinary action.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Late Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{assignment.latePolicy}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
