'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    moduleCode: z.string().min(1, "Module code is required"),
    password: z.string().min(1, "Enrollment password is required"),
});

interface EnrollmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EnrollmentDialog({ open, onOpenChange }: EnrollmentDialogProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            moduleCode: "",
            password: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        // Simulate enrollment
        onOpenChange(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-full">
                <DialogHeader>
                    <DialogTitle>Enroll in course</DialogTitle>
                    <DialogDescription>
                        Enter the code and password provided by your instructor to enroll in a new course.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="moduleCode"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Module Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. IT1010" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Enrollment Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full">Enroll</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
