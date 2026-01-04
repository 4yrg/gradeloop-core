"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classGroupSchema, ClassGroup, Person } from "../types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Upload } from "lucide-react";
import { AddStudentModal } from "./add-student-modal";
import { BulkImportModal } from "./bulk-import-modal";

interface ClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ClassGroup, studentIds: string[], importedStudents: Partial<Person>[]) => void;
    degreeId: string;
}

export function ClassModal({
    open,
    onOpenChange,
    onSubmit,
    degreeId,
}: ClassModalProps) {
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [importedStudents, setImportedStudents] = useState<Partial<Person>[]>([]);

    const form = useForm({
        resolver: zodResolver(classGroupSchema),
        defaultValues: {
            name: "",
            degreeId: degreeId,
            studentCount: 0,
        },
    });

    const handleSubmit = (data: ClassGroup) => {
        // Optimistic count: selected existing + imported
        const totalCount = selectedStudentIds.length + importedStudents.length;
        onSubmit(
            { ...data, degreeId, studentCount: totalCount },
            selectedStudentIds,
            importedStudents
        );
        form.reset();
        setSelectedStudentIds([]);
        setImportedStudents([]);
        onOpenChange(false);
    };

    const handleAddStudents = (studentIds: string[]) => {
        setSelectedStudentIds(studentIds);
        setIsAddStudentModalOpen(false);
    };

    const handleImportStudents = async (data: Partial<Person>[]) => {
        setImportedStudents((prev) => [...prev, ...data]);
        return Promise.resolve(); // BulkImportModal expects a promise
    };

    // CSV Mapping
    const mapCSVRow = (row: string[]): Partial<Person> | null => {
        // Expected: Student ID, First Name, Last Name, Email
        if (row.length < 4) return null;
        return {
            studentId: row[0],
            firstName: row[1],
            lastName: row[2],
            email: row[3],
            role: "student",
        };
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Class</DialogTitle>
                    <DialogDescription>
                        Add a new class group to this degree program.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="e.g. Class of 2026"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-3 border rounded-md p-3">
                        <Label>Students</Label>

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>{selectedStudentIds.length} existing students selected</p>
                                <p>{importedStudents.length} students to import</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddStudentModalOpen(true)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Class</Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            <AddStudentModal
                open={isAddStudentModalOpen}
                onOpenChange={setIsAddStudentModalOpen}
                currentStudentIds={selectedStudentIds}
                onAddStudents={handleAddStudents}
            />

            <BulkImportModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImport={handleImportStudents}
                entityName="Students"
                templateHeaders={["Student ID", "First Name", "Last Name", "Email"]}
                mapRow={mapCSVRow}
            />
        </Dialog>
    );
}
