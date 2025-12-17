"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
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
import { ForgotPasswordSchema, ForgotPasswordFormValues } from "@/schemas/auth.schema"
import { authService } from "@/services/auth.service"

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    const mutation = useMutation({
        mutationFn: authService.forgotPassword,
        onSuccess: () => {
            setIsSubmitted(true)
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : "Something went wrong")
        },
    })

    function onSubmit(values: ForgotPasswordFormValues) {
        setError(null)
        mutation.mutate(values.email)
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-none shadow-xl">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle>Check your email</CardTitle>
                            <CardDescription>
                                We have sent a password reset link to <span className="font-medium text-foreground">{form.getValues("email")}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Button asChild variant="outline">
                                <Link href="/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Login
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        )
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
                            Forgot Password
                        </CardTitle>
                        <CardDescription>
                            Enter your email address and we will send you a link to reset your password
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
                                    Send Reset Link
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button asChild variant="link" className="text-muted-foreground">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
