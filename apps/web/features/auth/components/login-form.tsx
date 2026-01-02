"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema, LoginValues } from "../schemas/auth"
import Link from "next/link"

export function LoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        setError(null)
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid email or password")
                return
            }

            router.push("/")
            router.refresh()
        } catch (err) {
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/" })
    }

    return (
        <div className="mx-auto max-w-sm w-full space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Login</h1>
                <p className="text-gray-500">Enter your credentials to access your account</p>
            </div>

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

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                Google
            </Button>
        </div>
    )
}
