"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Course } from "../types";

interface CoursesListProps {
    data: Course[];
    onEdit: (course: Course) => void;
    onDelete: (id: string) => void;
}

export function CoursesList({ data, onEdit, onDelete }: CoursesListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No courses found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((course) => (
                            <TableRow key={course.id}>
                                <TableCell className="font-medium">{course.code}</TableCell>
                                <TableCell>
                                    <div>{course.name}</div>
                                    {course.description && (
                                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                            {course.description}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{course.department}</TableCell>
                                <TableCell>{course.credits}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(course)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => course.id && onDelete(course.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )))}
                </TableBody>
            </Table>
        </div>
    );
}
