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
import { Edit, Trash2 } from "lucide-react";
import { Degree } from "../types";

interface DegreesListProps {
    data: Degree[];
    onEdit: (degree: Degree) => void;
    onDelete: (id: string) => void;
}

export function DegreesList({ data, onEdit, onDelete }: DegreesListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead>Degree Name</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No degrees found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((degree) => (
                            <TableRow key={degree.id}>
                                <TableCell className="font-medium">{degree.code}</TableCell>
                                <TableCell>
                                    <div>{degree.name}</div>
                                    {degree.description && (
                                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                            {degree.description}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{degree.requiredCredits}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(degree)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => degree.id && onDelete(degree.id)}
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
