"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { semesterSchema, Semester, SemesterTerm } from "../types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";


// Simple checkbox if component doesn't exist yet, but let's check.
// Using standard input type=checkbox for now to avoid dependency check issues, or assume Shadcn checkbox.
// Better to just use a Switch or Checkbox if available. I'll check imports.

interface SemesterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Semester) => void;
    initialData?: Semester | null;
}

export function SemesterModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
}: SemesterModalProps) {
    const form = useForm({
        resolver: zodResolver(semesterSchema),
        defaultValues: initialData || {
            term: "Spring",
            year: new Date().getFullYear(),
            startDate: new Date().toISOString().split("T")[0] + "T00:00:00Z", // Zod expects datetime
            endDate: new Date().toISOString().split("T")[0] + "T00:00:00Z",
            isActive: false,
        },
    });

    // Helper to handle date inputs (stripping time for input, adding back for Zod)
    const formatDateForInput = (isoString: string) => {
        return isoString ? isoString.split("T")[0] : "";
    };

    const handleSubmit = (data: Semester) => {
        // Ensure ISO format
        const formattedData = {
            ...data,
            startDate: new Date(data.startDate).toISOString(),
            endDate: new Date(data.endDate).toISOString(),
        }
        onSubmit(formattedData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Semester" : "Create Semester"}
                    </DialogTitle>
                    <DialogDescription>
                        Define academic terms and their duration.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="term">Term</Label>
                            <Select
                                defaultValue={form.getValues("term")}
                                onValueChange={(value) => form.setValue("term", value as SemesterTerm)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Spring">Spring</SelectItem>
                                    <SelectItem value="Summer">Summer</SelectItem>
                                    <SelectItem value="Fall">Fall</SelectItem>
                                    <SelectItem value="Winter">Winter</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.formState.errors.term && (
                                <p className="text-sm text-red-500">{form.formState.errors.term.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                type="number"
                                {...form.register("year", { valueAsNumber: true })}
                            />
                            {form.formState.errors.year && (
                                <p className="text-sm text-red-500">{form.formState.errors.year.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                defaultValue={formatDateForInput(form.getValues("startDate"))}
                                onChange={(e) => {
                                    const date = new Date(e.target.value);
                                    form.setValue("startDate", date.toISOString());
                                }}
                            />
                            {form.formState.errors.startDate && (
                                <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                defaultValue={formatDateForInput(form.getValues("endDate"))}
                                onChange={(e) => {
                                    const date = new Date(e.target.value);
                                    form.setValue("endDate", date.toISOString());
                                }}
                            />
                            {form.formState.errors.endDate && (
                                <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            {...form.register("isActive")}
                        />
                        <Label htmlFor="isActive">Set as Active Semester</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
