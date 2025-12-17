"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Code2, FileText } from "lucide-react"
import { Assignment, AssignmentStatus } from "@/types/assignment"

interface AssignmentsTableProps {
    assignments: Assignment[]
}

const statusColorMap: Record<AssignmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
    Open: "default", // or custom green
    Closed: "secondary",
    Submitted: "outline", // maybe blue-ish
    Graded: "secondary",
    Overdue: "destructive",
}

export function AssignmentsTable({ assignments }: AssignmentsTableProps) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{assignment.title}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{assignment.description}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={statusColorMap[assignment.status]}>
                                    {assignment.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(assignment.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                {assignment.status === 'Graded' ? `45/${assignment.points}` : `-/${assignment.points}`}
                            </TableCell>
                            <TableCell className="text-right">
                                {assignment.status === 'Open' || assignment.status === 'Submitted' ? (
                                    <Button size="sm" asChild>
                                        <Link href={assignment.submissionId ? `/ide/${assignment.submissionId}` : `/ide/new?assignmentId=${assignment.id}`}>
                                            <Code2 className="mr-2 h-4 w-4" />
                                            Launch IDE
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/student/assignments/${assignment.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Details
                                        </Link>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {assignments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No assignments found for this course.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
