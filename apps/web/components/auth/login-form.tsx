"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginValues } from "@/schemas/auth";
import { useLogin } from "@/hooks/use-auth";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GoogleLoginButton } from "./google-login-button";
import Link from "next/link";
import { cn } from "@/helpers/utils";

export function LoginForm({ className }: { className?: string }) {
    const router = useRouter();
    const { mutate: login, isPending } = useLogin();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    function onSubmit(data: LoginValues) {
        login(data, {
            onSuccess: () => {
                toast.success("Logged in successfully!");
                router.push("/dashboard"); // Stub redirect
            },
            onError: (error) => {
                toast.error(error.message || "Failed to login");
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
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Password</FormLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-muted-foreground hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>
            </Form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <GoogleLoginButton />
        </div>
    );
}
