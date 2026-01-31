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
import { Edit, Trash2 } from "lucide-react";
import { Person } from "../types";

interface PeopleListProps {
    data: Person[];
    onEdit: (person: Person) => void;
    onDelete: (id: string) => void;
}

export function PeopleList({ data, onEdit, onDelete }: PeopleListProps) {
    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'institute_admin': return 'destructive';
            case 'instructor': return 'default';
            default: return 'secondary';
        }
    };

    const formatRole = (role: string) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>
                            {data.some(p => p.role === 'instructor') ? 'Department' : 'Student ID'}
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No people found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((person) => (
                            <TableRow key={person.id}>
                                <TableCell className="font-medium">
                                    {person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No Name'}
                                </TableCell>
                                <TableCell>{person.email}</TableCell>
                                <TableCell>
                                    <Badge variant={getRoleBadgeVariant(person.role)}>
                                        {formatRole(person.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {person.role === 'student' ? (person.studentId || "-") : (person.department || "-")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(person)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => person.id && onDelete(person.id)}
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
