"use client";

import { use } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    FileSearch,
    Fingerprint,
    Info,
    Link as LinkIcon,
    ShieldAlert,
    ShieldCheck,
    Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function IntegrityPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/results/1`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Results
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl font-bold tracking-tight">Academic Integrity</h1>
                </div>
                <p className="text-muted-foreground">
                    Transparency report for Submission #1. We ensure a fair learning environment for everyone.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Similarity Analysis</CardTitle>
                                <CardDescription>Comparison run against global and local repositories.</CardDescription>
                            </div>
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-200">
                                Clear
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Overall Similarity</p>
                                    <p className="text-xs text-muted-foreground">Standard threshold: 25%</p>
                                </div>
                                <span className="text-3xl font-black text-primary">12%</span>
                            </div>
                            <Progress value={12} className="h-3" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-xl bg-muted/20 space-y-3">
                                <div className="flex items-center gap-2 text-primary">
                                    <Users className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Peer Comparison</span>
                                </div>
                                <p className="text-2xl font-bold">8%</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Matches found within this course's submissions. Mostly common boilerplate.
                                </p>
                            </div>
                            <div className="p-4 border rounded-xl bg-muted/20 space-y-3">
                                <div className="flex items-center gap-2 text-primary">
                                    <LinkIcon className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Web / Repository</span>
                                </div>
                                <p className="text-2xl font-bold">4%</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Matches found in public repositories (GitHub, StackOverflow, etc.)
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-primary" />
                                Code Fingerprint Details
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Variable Swapping", detected: "None", status: "pass" },
                                    { label: "Instruction Reordering", detected: "Low", status: "pass" },
                                    { label: "Logic Structural Matching", detected: "None", status: "pass" },
                                    { label: "Comments Similarity", detected: "None", status: "pass" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm p-2 hover:bg-muted/30 rounded transition-colors">
                                        <span className="text-muted-foreground">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{item.detected}</span>
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">What this means</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                            <p>
                                A score of <span className="text-foreground font-bold italic">12%</span> indicates that your code is highly original.
                                Minor matches are often due to common boilerplate or standard algorithm patterns.
                            </p>
                            <Alert variant="default" className="bg-primary/5 border-primary/20">
                                <Info className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">Threshold Note</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Flagged submissions usually have similarity scores above 35%.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-700">Appeal Flag</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-amber-800">
                                If you believe a flag on your work is incorrect, you can submit an appeal with documentation of your development process.
                            </p>
                            <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-900 hover:bg-amber-100">
                                Appeal Flag Status
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Reports Scan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Scan Time</span>
                                <span className="font-mono">Jan 04, 11:30 AM</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Engine</span>
                                <Badge variant="outline" className="text-[10px]">GL Integrity v2.4</Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest mt-2">
                                <FileSearch className="mr-2 h-3 w-3" />
                                View Detailed Logs
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
