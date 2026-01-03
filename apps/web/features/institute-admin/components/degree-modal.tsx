"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { degreeSchema, Degree } from "../types";
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

interface DegreeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Degree) => void;
    initialData?: Degree | null;
}

export function DegreeModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
}: DegreeModalProps) {
    const form = useForm<Degree>({
        resolver: zodResolver(degreeSchema),
        defaultValues: initialData || {
            name: "",
            code: "",
            description: "",
            requiredCredits: 0,
        },
    });

    // Reset form when initialData changes or modal opens
    // (In a real app, typically handled via useEffect or keys)

    const handleSubmit = (data: Degree) => {
        onSubmit(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Degree" : "Create Degree"}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? "Update the details of the degree program."
                            : "Add a new degree program to the institute."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="e.g. Bachelor of Science in CS"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Code</Label>
                            <Input id="code" {...form.register("code")} placeholder="e.g. BS-CS" />
                            {form.formState.errors.code && (
                                <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="credits">Credits</Label>
                            <Input
                                id="credits"
                                type="number"
                                {...form.register("requiredCredits", { valueAsNumber: true })}
                                placeholder="120"
                            />
                            {form.formState.errors.requiredCredits && (
                                <p className="text-sm text-red-500">{form.formState.errors.requiredCredits.message}</p>
                            )}
                        </div>
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
