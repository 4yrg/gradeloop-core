"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Check path
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Course } from "../types";
import { Search } from "lucide-react";

interface ManageCoursesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    availableCourses: Course[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => Promise<void>;
}

export function ManageCoursesDialog({
    open,
    onOpenChange,
    title,
    description,
    availableCourses,
    initialSelectedIds,
    onSave,
}: ManageCoursesDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedIds(initialSelectedIds);
            setSearchQuery("");
        }
    }, [open, initialSelectedIds]);

    const filteredCourses = availableCourses.filter((course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = (courseId: string) => {
        setSelectedIds((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId]
        );
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await onSave(selectedIds);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save courses", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search courses..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-4">
                        {filteredCourses.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                No courses found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredCourses.map((course) => (
                                    <div key={course.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`course-${course.id}`}
                                            checked={selectedIds.includes(course.id!)}
                                            onCheckedChange={() => handleToggle(course.id!)}
                                        />
                                        <label
                                            htmlFor={`course-${course.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                        >
                                            <span className="font-semibold">{course.code}</span> - {course.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="text-sm text-muted-foreground text-right">
                        {selectedIds.length} selected
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
