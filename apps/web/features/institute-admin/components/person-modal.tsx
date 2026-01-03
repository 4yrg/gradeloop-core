"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personSchema, Person, UserRole } from "../types";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PersonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Person) => void;
    initialData?: Person | null;
}

export function PersonModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
}: PersonModalProps) {
    const form = useForm<Person>({
        resolver: zodResolver(personSchema),
        defaultValues: initialData || {
            firstName: "",
            lastName: "",
            email: "",
            role: "student",
            studentId: "",
        },
    });

    const selectedRole = form.watch("role");

    const handleSubmit = (data: Person) => {
        onSubmit(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Person" : "Add Person"}
                    </DialogTitle>
                    <DialogDescription>
                        Add a new user to the institute.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                {...form.register("firstName")}
                                placeholder="e.g. John"
                            />
                            {form.formState.errors.firstName && (
                                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                {...form.register("lastName")}
                                placeholder="e.g. Doe"
                            />
                            {form.formState.errors.lastName && (
                                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...form.register("email")}
                            placeholder="john.doe@example.com"
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            defaultValue={form.getValues("role")}
                            onValueChange={(value) => form.setValue("role", value as UserRole)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                                <SelectItem value="institute_admin">Institute Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.role && (
                            <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
                        )}
                    </div>

                    {selectedRole === "student" && (
                        <div className="grid gap-2">
                            <Label htmlFor="studentId">Student ID</Label>
                            <Input
                                id="studentId"
                                {...form.register("studentId")}
                                placeholder="e.g. S12345678"
                            />
                            {form.formState.errors.studentId && (
                                <p className="text-sm text-red-500">{form.formState.errors.studentId.message}</p>
                            )}
                        </div>
                    )}

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
