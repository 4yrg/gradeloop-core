"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Edit, Trash2, CheckCircle2 } from "lucide-react";
import { Semester } from "../types";

interface SemestersListProps {
    data: Semester[];
    onEdit: (semester: Semester) => void;
    onDelete: (id: string) => void;
    onSetActive: (id: string) => void;
}

export function SemestersList({ data, onEdit, onDelete, onSetActive }: SemestersListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No semesters found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((semester) => (
                            <TableRow key={semester.id}>
                                <TableCell className="font-medium">{semester.term}</TableCell>
                                <TableCell>{semester.year}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    {semester.isActive ? (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {!semester.isActive && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Set as Active"
                                                onClick={() => semester.id && onSetActive(semester.id)}
                                            >
                                                <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-green-600" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(semester)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => semester.id && onDelete(semester.id)}
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
