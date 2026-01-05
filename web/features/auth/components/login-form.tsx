"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { loginSchema, LoginValues } from "../schemas/auth"
import { useLogin } from "../../../hooks/auth/useLogin"
import Link from "next/link"
import { useAuthLoading } from "../context/auth-loading-context"

export function LoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { setIsLoading } = useAuthLoading()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const { mutateAsync: loginMutation, isPending } = useLogin()

    // Sync hook loading state with local loading state if needed, or just use isPending
    // The existing component uses loading state for disable.

    async function onSubmit(data: LoginValues) {
        setLoading(true)
        setIsLoading(true)
        setError(null)

        try {
            const result = await loginMutation(data);
            console.log("Login result:", result);

            if (result.errors) {
                if ('_form' in result.errors && result.errors._form) {
                    setError(result.errors._form[0]);
                } else {
                    const firstError = Object.values(result.errors).flat()[0];
                    setError(firstError || 'Login failed');
                }
                setLoading(false);
                setIsLoading(false);
            }
            // Success redirect is handled by hook, but we can also do it here if hook doesn't.
            // My hook implementation does router.push.
        } catch (err) {
            console.error("Login error wrapped:", err);
            setError("Something went wrong")
            setLoading(false)
            setIsLoading(false)
        }
    }

    // Google login removed as NextAuth is removed

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Login</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Password
                            </label>
                            <Link href="/auth/forgot-password" className="text-sm underline">
                                Forgot password?
                            </Link>
                        </div>
                        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                        {errors.password && <p className="text-sm font-medium text-destructive">{errors.password.message}</p>}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>

            </CardContent>
        </Card>
    )
}
