"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { forgotPasswordSchema, ForgotPasswordValues } from "../schemas/auth"
import Link from "next/link"
import { forgotPassword } from "@/actions/auth"

export function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(data: ForgotPasswordValues) {
        setLoading(true)
        setError(null)

        try {
            const result = await forgotPassword(data)
            if (result.success) {
                setSuccess(true)
            } else if (result.errors) {
                if ('_form' in result.errors && result.errors._form) {
                    setError(result.errors._form[0])
                } else {
                    const firstError = Object.values(result.errors).flat()[0]
                    setError(firstError || 'An error occurred')
                }
            }
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="mx-auto max-w-sm w-full text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    <CardDescription>We have sent a password reset link to your email.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                <CardDescription>Enter your email to reset your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Email
                        </label>
                        <Input id="email" placeholder="m@example.com" {...register("email")} />
                        {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                    </Button>
                </form>
                <div className="text-center text-sm">
                    <Link href="/login" className="underline">
                        Back to Login
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
