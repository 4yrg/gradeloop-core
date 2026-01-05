'use client';

import { Badge } from "../../ui/badge";
import {
    Eye,
    Send,
    MoreHorizontal,
    ExternalLink
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button as ShadcnButton } from "../../ui/button";

interface AssignmentTopBarProps {
    assignmentName: string;
    courseName: string;
    status: 'Draft' | 'Published' | 'Closed';
}

export function AssignmentTopBar({ assignmentName, courseName, status }: AssignmentTopBarProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Published': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Draft': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Closed': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return '';
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 lg:px-8">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight">{assignmentName}</h2>
                        <Badge variant="outline" className={getStatusColor(status)}>
                            {status}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{courseName}</p>
                </div>

                <div className="flex items-center gap-2">
                    <ShadcnButton variant="outline" size="sm" className="hidden md:flex">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview as Student
                    </ShadcnButton>
                    <ShadcnButton size="sm" className="hidden md:flex">
                        <Send className="mr-2 h-4 w-4" />
                        Publish
                    </ShadcnButton>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <ShadcnButton variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More</span>
                            </ShadcnButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="md:hidden">
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem className="md:hidden">
                                <Send className="mr-2 h-4 w-4" />
                                Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                Archive Assignment
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
