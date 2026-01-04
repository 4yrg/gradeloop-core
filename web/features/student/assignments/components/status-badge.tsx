"use client";

import { Badge } from "@/components/ui/badge";
import { AssignmentStatus } from "../data/mock-assignments";

interface StatusBadgeProps {
    status: AssignmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const configs: Record<AssignmentStatus, { label: string; variant: "outline" | "secondary" | "default" | "destructive" | "success" }> = {
        not_started: { label: "Not Started", variant: "secondary" },
        in_progress: { label: "In Progress", variant: "default" },
        submitted: { label: "Submitted", variant: "success" },
        late: { label: "Late", variant: "destructive" },
        graded: { label: "Graded", variant: "outline" },
    };

    const config = configs[status];

    // Note: "success" variant might not exist in default shadcn badge, 
    // but I can style it via className if needed.
    // Let's check common shadcn variants or use secondary with a custom color.

    return (
        <Badge
            variant={config.variant as any}
            className={status === 'submitted' ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200" : ""}
        >
            {config.label}
        </Badge>
    );
}
