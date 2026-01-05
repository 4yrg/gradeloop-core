"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
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
import { peopleService } from "../api/people-service";
import { Person } from "../types";
import { cn } from "../../../lib/utils";

interface AddInstructorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentInstructorIds: string[];
    onAddInstructors: (ids: string[]) => void;
}

export function AddInstructorModal({
    open,
    onOpenChange,
    currentInstructorIds,
    onAddInstructors,
}: AddInstructorModalProps) {
    const [instructors, setInstructors] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter available instructors (role=instructor, not already added)
    const availableInstructors = instructors.filter(
        (p) => !currentInstructorIds.includes(p.id || "") &&
            p.role === "instructor" &&
            (p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        if (open) {
            loadInstructors();
            setSelectedIds([]);
            setSearchQuery("");
        }
    }, [open]);

    const loadInstructors = async () => {
        setLoading(true);
        try {
            const data = await peopleService.getPeople();
            setInstructors(data);
        } catch (error) {
            console.error("Failed to load instructors", error);
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
            await onAddInstructors(selectedIds);
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
                    <DialogTitle>Add Instructors</DialogTitle>
                    <DialogDescription>
                        Select instructors to assign to this course.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search instructors..."
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
                            {availableInstructors.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">
                                    No eligible instructors found.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {availableInstructors.map((instructor) => {
                                        const isSelected = instructor.id ? selectedIds.includes(instructor.id) : false;
                                        return (
                                            <div
                                                key={instructor.id}
                                                className={cn(
                                                    "flex items-center space-x-3 p-2 rounded-sm cursor-pointer transition-colors",
                                                    isSelected ? "bg-accent" : "hover:bg-accent/50"
                                                )}
                                                onClick={() => instructor.id && handleSelect(instructor.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {instructor.firstName} {instructor.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {instructor.email}
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
                        <span>{availableInstructors.length} available</span>
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
