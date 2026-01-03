"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { classesService } from "@/features/institute-admin/api/classes-service";
import { ClassGroup } from "@/features/institute-admin/types";

interface AddClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: string;
    degreeId: string;
    currentClassIds: string[];
    onAddClasses: (classIds: string[]) => void;
}

export function AddClassModal({
    open,
    onOpenChange,
    courseId,
    degreeId,
    currentClassIds,
    onAddClasses,
}: AddClassModalProps) {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Filter available classes (same degree, not already added)
    const availableClasses = classes.filter(
        (c) => !currentClassIds.includes(c.id || "")
    );

    useEffect(() => {
        if (open && degreeId) {
            loadClasses();
            setSelectedIds([]);
        }
    }, [open, degreeId]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const data = await classesService.getClassesForDegree(degreeId);
            setClasses(data);
        } catch (error) {
            console.error("Failed to load classes", error);
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
            await onAddClasses(selectedIds);
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
                    <DialogTitle>Add Classes to Course</DialogTitle>
                    <DialogDescription>
                        Select classes to enroll in this course.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border p-2 max-h-[300px] overflow-y-auto">
                            {availableClasses.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">
                                    No eligible classes found.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {availableClasses.map((cls) => {
                                        const isSelected = cls.id ? selectedIds.includes(cls.id) : false;
                                        return (
                                            <div
                                                key={cls.id}
                                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                                onClick={() => cls.id && handleSelect(cls.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by div click
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {cls.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cls.studentCount} Students
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                        <span>{availableClasses.length} available</span>
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
