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
    degreeId: string;
}

export function CourseModal({
    open,
    onOpenChange,
    onSubmit,
    degreeId,
}: CourseModalProps) {
    const form = useForm({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: "",
            code: "",
            credits: 3,
            description: "",
            department: "",
            degreeId: degreeId,
        },
    });

    const handleSubmit = (data: Course) => {
        onSubmit({ ...data, degreeId });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Course</DialogTitle>
                    <DialogDescription>
                        Add a new course to the curriculum.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="e.g. Introduction to Programming"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                {...form.register("code")}
                                placeholder="e.g. CS101"
                            />
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
                            placeholder="Optional course description..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Course</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
