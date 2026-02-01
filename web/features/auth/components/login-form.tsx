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
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const { setIsLoading } = useAuthLoading()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
        },
    })

    const { mutateAsync: loginMutation } = useLogin()

    async function onSubmit(data: LoginValues) {
        setLoading(true)
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            await loginMutation(data); // This now calls requestMagicLink
            // Result handling in mutateAsync?
            // Assuming hook handles it, but hook likely returns the response.
            setSuccessMessage("If an account matches that email, we've sent a magic link. Please check your inbox.")
            setLoading(false)
            setIsLoading(false)
        } catch (err) {
            console.error("Login error wrapped:", err);
            setError("Something went wrong")
            setLoading(false)
            setIsLoading(false)
        }
    }

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>Enter your email to receive a magic link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {successMessage ? (
                    <div className="text-center p-4 bg-green-50 text-green-700 rounded-md">
                        {successMessage}
                    </div>
                ) : (
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
                            Send Magic Link
                        </Button>
                    </form>
                )}

                <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/register" className="underline">
                        Sign Up
                    </Link>
                </div>

            </CardContent>
        </Card>
    )
}
