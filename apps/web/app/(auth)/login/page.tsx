"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoginSchema, LoginFormValues } from "@/schemas/auth.schema"
import { authService } from "@/services/auth.service"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const mutation = useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            // In a real app, you'd store the token here (e.g., cookie or zustand)
            console.log("Logged in:", data)

            // Redirect based on role
            switch (data.user.role) {
                case "student":
                    router.push("/student/dashboard")
                    break
                case "instructor":
                    router.push("/instructor/dashboard")
                    break
                case "admin":
                    router.push("/admin/dashboard")
                    break
                default:
                    router.push("/dashboard")
            }
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : "Something went wrong")
        },
    })

    function onSubmit(values: LoginFormValues) {
        setError(null)
        mutation.mutate(values)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-none shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            GradeLoop
                        </CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="name@university.edu"
                                                    {...field}
                                                    disabled={mutation.isPending}
                                                />
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
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                    disabled={mutation.isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {error && (
                                    <div className="text-sm font-medium text-destructive text-center">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Sign In
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                        <Link
                            href="/forgot-password"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Forgot your password?
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
