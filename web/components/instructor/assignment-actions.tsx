'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, Edit, Trash, Send, Archive, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface AssignmentActionsProps {
    courseId: string;
    assignmentId: string;
    published: boolean;
}

export function AssignmentActions({ courseId, assignmentId, published }: AssignmentActionsProps) {
    const router = useRouter();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Assignment
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Export Submissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {published ? (
                    <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Unpublish
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Publish Now
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
