"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../../components/ui/card";

export default function VivaPracticePage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4 pt-6">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/viva`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Viva Overview
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Practice Mode</h1>
                    <p className="text-muted-foreground mt-1">
                        Test your setup and practice answering sample questions without grading.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-dashed">
                    <CardHeader>
                        <CardTitle>System Check Practice</CardTitle>
                        <CardDescription>Verify your camera and microphone in a simulated environment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="secondary">
                            Run Diagnostics
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Mock Interview</CardTitle>
                        <CardDescription>Answer 3 random sample questions with AI feedback.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full">
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Mock Session
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
