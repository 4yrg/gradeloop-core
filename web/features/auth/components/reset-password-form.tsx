"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import Link from "next/link"
import { resetPassword } from "../../../actions/auth"
import { resetPasswordSchema, ResetPasswordValues } from "../schemas/auth"


export function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(data: ResetPasswordValues) {
        if (!token) {
            setError("Invalid or missing token")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await resetPassword({ ...data, token })
            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
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

    if (!token) {
        return (
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-red-500">Invalid Link</CardTitle>
                    <CardDescription>The password reset link is invalid or missing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/forgot-password">Request New Link</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (success) {
        return (
            <Card className="mx-auto max-w-sm w-full text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-green-500">Success!</CardTitle>
                    <CardDescription>Your password has been reset successfully.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Redirecting to login...</p>
                    <Button asChild className="w-full">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                        {errors.password && <p className="text-sm font-medium text-destructive">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("confirmPassword")}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                        {errors.confirmPassword && <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
