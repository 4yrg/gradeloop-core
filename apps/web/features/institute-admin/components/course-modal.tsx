"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, Course } from "../types";
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
import { Textarea } from "@/components/ui/textarea";

interface CourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Course) => void;
    initialData?: Course | null;
}

export function CourseModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
}: CourseModalProps) {
    const form = useForm<Course>({
        resolver: zodResolver(courseSchema),
        defaultValues: initialData || {
            name: "",
            code: "",
            description: "",
            credits: 0,
            department: "",
        },
    });

    const handleSubmit = (data: Course) => {
        onSubmit(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Course" : "Create Course"}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? "Update course details."
                            : "Add a new course to the institute catalog."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Course Name</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="e.g. Introduction to Computer Science"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Course Code</Label>
                            <Input id="code" {...form.register("code")} placeholder="e.g. CS101" />
                            {form.formState.errors.code && (
                                <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="credits">Credits</Label>
                            <Input
                                id="credits"
                                type="number"
                                {...form.register("credits", { valueAsNumber: true })}
                                placeholder="3"
                            />
                            {form.formState.errors.credits && (
                                <p className="text-sm text-red-500">{form.formState.errors.credits.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            {...form.register("department")}
                            placeholder="e.g. Computer Science"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...form.register("description")}
                            placeholder="Optional description..."
                        />
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
