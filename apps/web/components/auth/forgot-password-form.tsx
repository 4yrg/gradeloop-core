"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordValues } from "@/schemas/auth";
import { useForgotPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/helpers/utils";

export function ForgotPasswordForm({ className }: { className?: string }) {
    const { mutate: resetPassword, isPending } = useForgotPassword();

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    function onSubmit(data: ForgotPasswordValues) {
        resetPassword(data, {
            onSuccess: () => {
                toast.success("Check your email for a reset link.");
            },
            onError: () => {
                toast.error("Failed to send reset email.");
            },
        });
    }

    return (
        <div className={cn("grid gap-6", className)}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="name@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                    </Button>
                </form>
            </Form>
            <div className="text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:underline"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
