"use client";

import { Person } from "../types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Trash2 } from "lucide-react";

interface StudentListTableProps {
    data: Person[];
    onRemoveStudent: (studentId: string) => void;
}

export function StudentListTable({ data, onRemoveStudent }: StudentListTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No students assigned to this class.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.studentId || "N/A"}</TableCell>
                                <TableCell>{student.firstName} {student.lastName}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => student.id && onRemoveStudent(student.id)}
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
