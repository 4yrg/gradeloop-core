"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { forgotPasswordSchema, ForgotPasswordValues } from "../schemas/auth"
import Link from "next/link"

export function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

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
        // Simulate API call
        setTimeout(() => {
            console.log("Forgot password for:", data.email)
            setSuccess(true)
            setLoading(false)
        }, 1000)
    }

    if (success) {
        return (
            <div className="mx-auto max-w-sm w-full space-y-6 text-center">
                <h2 className="text-2xl font-bold">Check your email</h2>
                <p className="text-gray-500">We have sent a password reset link to your email.</p>
                <Button asChild className="w-full">
                    <Link href="/login">Back to Login</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-sm w-full space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Forgot Password</h1>
                <p className="text-gray-500">Enter your email to reset your password</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email
                    </label>
                    <Input id="email" placeholder="m@example.com" {...register("email")} />
                    {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                </div>

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
        </div>
    )
}
