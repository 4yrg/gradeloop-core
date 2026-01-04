"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function VivaResultsPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-4xl mx-auto w-full px-4 pt-6">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/viva`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Viva Overview
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
                        <p className="text-muted-foreground">Completed on Jan 4, 2026</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Report
                        </Button>
                        <Button variant="outline" size="sm">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-green-700">Excellent Performance</h2>
                            <p className="text-green-600/80">You demonstrated strong understanding of core concepts.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Overall Score</p>
                        <div className="text-5xl font-black text-foreground">92<span className="text-2xl text-muted-foreground font-medium">/100</span></div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Concept Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">AVL Tree Rotations</span>
                                <span className="font-bold text-green-600">10/10</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Time Complexity Analysis</span>
                                <span className="font-bold text-green-600">8/10</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[80%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Communication Clarity</span>
                                <span className="font-bold text-yellow-600">18/20</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[90%]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Instructor Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground italic">
                            "Excellent explanation of the rotation cases. You clearly articulated the difference between single and double rotations. For time complexity, try to be more specific about worst-case vs average-case scenarios."
                        </p>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <div className="h-8 w-8 rounded-full bg-zinc-200" />
                            <div>
                                <p className="text-sm font-bold">Prof. Jane Doe</p>
                                <p className="text-xs text-muted-foreground">Evaluator</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
