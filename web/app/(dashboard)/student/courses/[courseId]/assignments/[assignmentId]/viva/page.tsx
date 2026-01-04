"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VivaStatusCard } from "@/components/student/viva/VivaStatusCard";
import { SystemCheckWidget } from "@/components/student/viva/SystemCheckWidget";
import { ConceptsTestedList } from "@/components/student/viva/ConceptsTestedList";
import { StartVivaButton } from "@/components/student/viva/StartVivaButton";

export default function VivaLandingPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    // Mock data - in a real app, this would come from an API
    const mockConcepts = [
        { id: '1', label: 'AVL Tree Rotations', description: 'Understanding of single and double rotations.', importance: 'high' as const },
        { id: '2', label: 'Time Complexity', description: 'Big O notation for search and insert operations.', importance: 'medium' as const },
        { id: '3', label: 'Memory Management', description: 'Heap vs Stack allocation for nodes.', importance: 'low' as const },
    ];

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4 pt-6">
            {/* Header / Nav */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignment
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Viva Evaluation</h1>
                    <p className="text-muted-foreground mt-1">
                        Automated oral examination for "Advanced Data Structures".
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Status & Readiness */}
                <div className="md:col-span-2 space-y-6">
                    <VivaStatusCard
                        status="not_started"
                        scheduledDate="Today, 10:00 AM"
                        duration="15 mins"
                    />

                    <div className="prose dark:prose-invert max-w-none">
                        <h3>Instructions</h3>
                        <ul>
                            <li>Ensure you are in a quiet environment.</li>
                            <li>You will be asked 3-5 questions based on the rubric.</li>
                            <li>Speak clearly and look at the camera.</li>
                            <li>The session will be recorded for review.</li>
                        </ul>
                    </div>

                    <ConceptsTestedList concepts={mockConcepts} />
                </div>

                {/* Right Column: Actions & Widgets */}
                <div className="space-y-6">
                    <SystemCheckWidget />

                    <StartVivaButton
                        courseId={courseId}
                        assignmentId={assignmentId}
                        isEnabled={true}
                    />

                    <div className="text-xs text-center text-muted-foreground">
                        By starting, you agree to the academic integrity policy.
                    </div>
                </div>
            </div>
        </div>
    );
}
