'use client';

import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Plus, MoreHorizontal, FileText, Calendar, Clock, Filter, Download } from "lucide-react";
import { mockAssignments } from "@/lib/mock-data";

export default function InstructorAssignmentsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const handleRowClick = (assignmentId: string) => {
        router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}`);
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Assignments</h1>
                    <p className="text-muted-foreground mt-1">Manage and track all assignments for this course.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Assignment
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold text-primary py-4">Assignments</TableHead>
                                <TableHead className="font-bold text-primary">Released</TableHead>
                                <TableHead className="font-bold text-primary">Due</TableHead>
                                <TableHead className="text-center font-bold text-primary">Submissions</TableHead>
                                <TableHead className="text-center font-bold text-primary">Graded %</TableHead>
                                <TableHead className="text-center font-bold text-primary">Status</TableHead>
                                <TableHead className="text-center font-bold text-primary">Regrades</TableHead>
                                <TableHead className="text-right font-bold text-primary">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockAssignments.map((assignment) => (
                                <TableRow
                                    key={assignment.id}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => handleRowClick(assignment.id)}
                                >
                                    <TableCell className="font-medium py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {assignment.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {assignment.released}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-medium">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            {assignment.due}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-medium">
                                            {assignment.submissions}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-12 h-1.5 bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: assignment.graded }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium">{assignment.graded}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {assignment.published ? (
                                            <Badge className="bg-primary hover:bg-primary/90">Published</Badge>
                                        ) : (
                                            <Badge variant="secondary">Draft</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={assignment.regrades > 0 ? "text-primary font-bold" : "text-muted-foreground"}>
                                            {assignment.regrades}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
