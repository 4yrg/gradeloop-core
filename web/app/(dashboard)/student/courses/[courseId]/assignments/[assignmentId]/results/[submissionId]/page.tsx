"use client";

import { use } from "react";
import {
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    FileText,
    GraduationCap,
    MessageSquare,
    Search,
    ShieldAlert,
    Timer,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ResultsPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string; submissionId: string }>
}) {
    const { courseId, assignmentId, submissionId } = use(params);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/history`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to History
                    </Link>
                </Button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Submission Results</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            Submission #{submissionId} • Jan 04, 2024 • Python
                        </p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 flex flex-col items-center">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Score</span>
                        <span className="text-4xl font-black text-primary">85<span className="text-xl text-muted-foreground">/100</span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Test Case Breakdown</CardTitle>
                        <CardDescription>Automated tests ran across 15 cases.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-center">
                                <p className="text-xs text-green-600 font-bold uppercase mb-1">Passed</p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                            <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-center">
                                <p className="text-xs text-destructive font-bold uppercase mb-1">Failed</p>
                                <p className="text-2xl font-bold">3</p>
                            </div>
                            <div className="bg-muted rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Hidden</p>
                                <p className="text-2xl font-bold">5</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="border rounded-lg group">
                                    <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {i % 2 === 0 ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                            <span className="text-sm font-medium">Public Test Case {i}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-muted-foreground font-mono">0.0{i}s</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span>CPU Usage</span>
                                    <span>1.2s avg</span>
                                </div>
                                <Progress value={45} className="h-1.5" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span>Memory</span>
                                    <span>64MB / 256MB</span>
                                </div>
                                <Progress value={25} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                                <ShieldAlert className="h-5 w-5" />
                                Integrity Scan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Similarity Score: <span className="font-bold">12%</span></p>
                            <p className="text-xs text-muted-foreground mt-1 tracking-tight">
                                No issues found. Comparison run against 150+ other submissions.
                            </p>
                            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                                <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/integrity`}>
                                    Detailed Dashboard
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <Card>
                    <Tabs defaultValue="feedback" className="w-full">
                        <div className="px-6 pt-4 border-b">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger value="feedback" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Instructor Feedback
                                </TabsTrigger>
                                <TabsTrigger value="rubric" className="gap-2">
                                    <ClipboardCheck className="h-4 w-4" />
                                    Rubric Breakdown
                                </TabsTrigger>
                                <TabsTrigger value="logs" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Compilation Logs
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="feedback" className="p-6">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <GraduationCap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">Prof. Jane Doe</span>
                                            <span className="text-xs text-muted-foreground">Jan 05, 2024</span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            Excellent work on the tree rotation logic. You handled the edge cases for the delete operation very well.
                                            However, your time complexity for the search operation seems to be O(N) in some scenarios. Check your balancing logic.
                                        </p>
                                        <div className="bg-muted rounded-lg p-3 text-xs font-mono mt-4 border-l-4 border-primary">
                                            <p className="text-primary font-bold mb-1">// Annotated Code Comment (Line 45)</p>
                                            <p>"This search function should return early if the value is found at the current node."</p>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/regrade`}>
                                        Request Regrade / Appeal
                                    </Link>
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="rubric" className="p-6">
                            <div className="space-y-4">
                                {[
                                    { name: "Logic Correctness", score: 40, max: 40, comment: "All public cases passed." },
                                    { name: "Code Quality", score: 15, max: 20, comment: "Naming conventions followed, but missing some docstrings." },
                                    { name: "Complexity", score: 10, max: 20, comment: "Search operation is inefficient." },
                                    { name: "Documentation", score: 20, max: 20, comment: "Clear comments throughout." },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-4 rounded-lg bg-muted/30 border">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-sm">{item.name}</span>
                                            <span className="font-black text-primary">{item.score}<span className="text-muted-foreground">/{item.max}</span></span>
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">"{item.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="p-6">
                            <ScrollArea className="h-[300px] w-full bg-zinc-950 rounded-lg p-4">
                                <pre className="text-xs font-mono text-zinc-400">
                                    {`Compiling solution.py...\nDone.\n\nRunning Test Suite...\n[INFO] Starting execution with memory limit 256MB.\n[DEBUG] Case 1: Initializing data structures.\n[DEBUG] Case 1: Loop started.\n[INFO] Case 1: Finished in 0.05s.\n[ERROR] Case 3: RecursionDepthExceeded at line 78.\n...`}
                                </pre>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
