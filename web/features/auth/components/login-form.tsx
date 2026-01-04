"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginSchema, LoginValues } from "../schemas/auth"
import { login } from "@/actions/auth"
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

    async function onSubmit(data: LoginValues) {
        setLoading(true)
        setIsLoading(true)
        setError(null)

        const formData = new FormData();
        formData.append('username', data.email); // Assuming email is username
        formData.append('password', data.password);

        try {
            const result = await login({} as any, formData);

            if ('errors' in result && result.errors && '_form' in result.errors && result.errors._form) {
                setError(result.errors._form[0]);
                setLoading(false);
                setIsLoading(false);
                return;
            } else if ('success' in result && result.success) {
                router.refresh();
                router.push("/dashboard"); // Assuming dashboard is the default protected route
            } else {
                setError('An unexpected error occurred.');
                setLoading(false);
                setIsLoading(false);
            }
        } catch (err) {
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
                            <Link href="/forgot-password" className="text-sm underline">
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
