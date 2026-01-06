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
import { Trash2, Star } from "lucide-react";
import { Person } from "../types";

interface InstructorListTableProps {
    instructors: Person[];
    moduleLeaderId?: string;
    onRemove: (id: string) => void;
    onSetLeader: (id: string) => void;
}

export function InstructorListTable({
    instructors,
    moduleLeaderId,
    onRemove,
    onSetLeader
}: InstructorListTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {instructors.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No instructors assigned.
                            </TableCell>
                        </TableRow>
                    ) : (
                        instructors.map((instructor) => {
                            const isLeader = instructor.id === moduleLeaderId;
                            return (
                                <TableRow key={instructor.id}>
                                    <TableCell className="font-medium">
                                        {instructor.fullName}
                                    </TableCell>
                                    <TableCell>{instructor.email}</TableCell>
                                    <TableCell>
                                        {isLeader ? (
                                            <Badge variant="default" className="bg-primary/90 hover:bg-primary/90">
                                                <Star className="mr-1 h-3 w-3 fill-current" />
                                                Module Leader
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => instructor.id && onSetLeader(instructor.id)}>
                                                Supplementary
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => instructor.id && onRemove(instructor.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
