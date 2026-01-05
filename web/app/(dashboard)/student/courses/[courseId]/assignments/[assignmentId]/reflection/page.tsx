"use client";

import { use, useState } from "react";
import {
    ArrowLeft,
    Lightbulb,
    MessageSquare,
    Rocket,
    Star,
    Target,
    ThumbsUp,
    Trophy
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../../../../components/ui/card";
import { Textarea } from "../../../../../../../../components/ui/textarea";
import { Badge } from "../../../../../../../../components/ui/badge";
import { Separator } from "../../../../../../../../components/ui/separator";

export default function ReflectionPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4 text-center items-center">
                <Button variant="ghost" asChild className="self-start -ml-2">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/results/1`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Results
                    </Link>
                </Button>
                <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <Rocket className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Growth & Reflection</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Complete this reflection to finalize your assignment experience and receive constructive resources for improvement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                What You Did Well
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 flex gap-4">
                                <ThumbsUp className="h-5 w-5 text-green-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-green-800">Recursive Implementation</p>
                                    <p className="text-xs text-green-700">Your use of recursion for tree balancing was clean and well-documented.</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 flex gap-4">
                                <ThumbsUp className="h-5 w-5 text-green-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-green-800">Edge Case Handling</p>
                                    <p className="text-xs text-green-700">Deletion from a leaf node and single-child nodes were handled perfectly.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Focus for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex gap-4">
                                <Lightbulb className="h-5 w-5 text-blue-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-blue-800">Memory Efficiency</p>
                                    <p className="text-xs text-blue-700">Try to minimize object creation during tree rotations to reduce overhead.</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex gap-4">
                                <Lightbulb className="h-5 w-5 text-blue-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-blue-800">Algorithm Complexity</p>
                                    <p className="text-xs text-blue-700">Review O(log N) search logic to ensure no hidden linear scans.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg">Reflection Form</CardTitle>
                            <CardDescription>Share your experience to help us improve the course.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How difficult was this assignment?</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Button key={i} variant="outline" className="flex-1 hover:border-primary hover:text-primary transition-all">
                                            {i}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What was the most challenging part?</label>
                                <Textarea placeholder="Type your response here..." className="bg-background min-h-[100px]" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Self-Correction</label>
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-background text-sm">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    <span>I understand why I missed 15 points.</span>
                                </div>
                            </div>
                            <Button className="w-full" onClick={() => setSubmitted(true)} disabled={submitted}>
                                {submitted ? "Reflection Saved" : "Save Reflection"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Suggested Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { title: "AVL Tree Rotations Visualized", type: "Video" },
                                { title: "Optimizing Python Recursion", type: "Article" },
                                { title: "Binary Tree Mastery Path", type: "Module" },
                            ].map((res, i) => (
                                <div key={i} className="flex justify-between items-center text-xs group cursor-pointer hover:bg-muted p-2 rounded transition-colors">
                                    <span className="group-hover:text-primary transition-colors">{res.title}</span>
                                    <Badge variant="outline" className="text-[9px]">{res.type}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
