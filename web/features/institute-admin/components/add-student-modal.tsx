"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";

import { Person } from "../types";
import { peopleService } from "../api/people.api";

interface AddStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentStudentIds: string[];
    onAddStudents: (studentIds: string[]) => void;
}

export function AddStudentModal({
    open,
    onOpenChange,
    currentStudentIds,
    onAddStudents,
}: AddStudentModalProps) {
    const [students, setStudents] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filtered available students (excluding those already in class)
    const availableStudents = students.filter(
        (s) => !currentStudentIds.includes(s.id || "") &&
            s.role === "student" &&
            (s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        if (open) {
            loadStudents();
            setSelectedIds([]);
            setSearchQuery("");
        }
    }, [open]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await peopleService.getPeople("student");
            setStudents(data);
        } catch (error) {
            console.error("Failed to load students", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onAddStudents(selectedIds);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Students to Class</DialogTitle>
                    <DialogDescription>
                        Select students to enroll in this class.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border p-2 max-h-[300px] overflow-y-auto">
                            {availableStudents.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">
                                    No eligible students found.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {availableStudents.map((student) => {
                                        const isSelected = student.id ? selectedIds.includes(student.id) : false;
                                        return (
                                            <div
                                                key={student.id}
                                                className={cn(
                                                    "flex items-center space-x-3 p-2 rounded-sm cursor-pointer transition-colors",
                                                    isSelected ? "bg-accent" : "hover:bg-accent/50"
                                                )}
                                                onClick={() => student.id && handleSelect(student.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by div click
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium leading-none">
                                                            {student.fullName}
                                                        </p>
                                                        {student.studentId && (
                                                            <span className="text-[10px] bg-secondary px-1 rounded text-secondary-foreground">
                                                                {student.studentId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{availableStudents.length} available</span>
                        <span>{selectedIds.length} selected</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedIds.length === 0 || submitting}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Selected
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
