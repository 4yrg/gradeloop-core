"use client";

import { Button } from "../../ui/button";
import Link from "next/link";
import { Play } from "lucide-react";

interface StartVivaButtonProps {
    courseId: string;
    assignmentId: string;
    isEnabled: boolean;
}

export function StartVivaButton({ courseId, assignmentId, isEnabled }: StartVivaButtonProps) {
    if (!isEnabled) {
        return (
            <Button size="lg" className="w-full" disabled>
                <Play className="mr-2 h-4 w-4" />
                Start Viva Now
            </Button>
        );
    }

    return (
        <Button size="lg" className="w-full bg-primary hover:bg-primary/90" asChild>
            <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/viva/session`}>
                <Play className="mr-2 h-4 w-4" />
                Start Viva Now
            </Link>
        </Button>
    );
}
