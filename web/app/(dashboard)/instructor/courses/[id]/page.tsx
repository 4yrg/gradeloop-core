'use client';

import { useParams, useRouter } from "next/navigation";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../../../../components/ui/table";
import { Plus, FileText, Calendar, CheckCircle2, Clock } from "lucide-react";
import { mockCourse, mockAssignments } from "../../../../../lib/mock-data";
import { AssignmentActions } from "../../../../../components/instructor/assignment-actions";
import { useAssignmentStore } from "../../../../../stores/use-assignment-store";
import { CreateAssignmentDialog } from "../../../../../components/instructor/create-assignment-dialog";

export default function InstructorCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const { setOpen } = useAssignmentStore();

    // Filter for active assignments (published only for the dashboard view)
    const activeAssignments = mockAssignments.filter(a => a.published);

    const handleRowClick = (assignmentId: string) => {
        router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}`);
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider font-medium">
                    <span>{mockCourse.semester}</span>
                    <span>•</span>
                    <span>{mockCourse.degree}</span>
                    <span>•</span>
                    <span>{mockCourse.specialization}</span>
                    <span>•</span>
                    <span className="font-bold text-primary">{mockCourse.code}</span>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold tracking-tight">{mockCourse.name}</h1>
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assignment
                    </Button>
                </div>
            </div>

            <CreateAssignmentDialog />

            {/* Description & Objectives */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Description</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {mockCourse.description}
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Objectives</h2>
                    <ul className="space-y-2">
                        {mockCourse.objectives.map((obj, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{obj}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Assignments Table */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold italic tracking-tight underline underline-offset-8 decoration-primary/20">Active Assignments</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Next deadline: Oct 15</span>
                        </div>
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
                                <TableHead className="text-center font-bold text-primary">Published</TableHead>
                                <TableHead className="text-center font-bold text-primary">Regrades</TableHead>
                                <TableHead className="text-right font-bold text-primary">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeAssignments.map((assignment) => (
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
                                        <Badge className="bg-primary hover:bg-primary/90">Published</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={assignment.regrades > 0 ? "text-primary font-bold" : "text-muted-foreground"}>
                                            {assignment.regrades}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AssignmentActions
                                            courseId={courseId}
                                            assignmentId={assignment.id}
                                            published={assignment.published}
                                        />
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
