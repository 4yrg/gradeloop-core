"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { registerSchema, RegisterValues } from "../schemas/auth"
import { useRegister } from "../../../hooks/auth/useRegister"
import { useAuthLoading } from "../context/auth-loading-context"

export function RegisterForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const { setIsLoading } = useAuthLoading()

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            role: undefined,
        },
    })

    const { mutateAsync: registerMutation } = useRegister()

    async function onSubmit(data: RegisterValues) {
        setLoading(true)
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await registerMutation(data);
            console.log("Registration result:", result);

            if (result.errors) {
                if ('_form' in result.errors && result.errors._form) {
                    setError(result.errors._form[0]);
                } else {
                    const firstError = Object.values(result.errors).flat()[0];
                    setError(firstError || 'Registration failed');
                }
                setLoading(false);
                setIsLoading(false);
            } else {
                // Success
                setSuccess(true)
                setLoading(false)
                setIsLoading(false)
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("Something went wrong. Please try again.")
            setLoading(false)
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    <CardDescription>
                        We've sent a confirmation link to your email address. Please click the link to activate your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-sm">
                        <Link href="/login" className="underline">
                            Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                <CardDescription>Enter your details to create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name Field - Maps to backend 'name' field */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Name
                        </label>
                        <Input id="name" placeholder="John Doe" {...register("name")} />
                        {errors.name && <p className="text-sm font-medium text-destructive">{errors.name.message}</p>}
                    </div>

                    {/* Email Field - Sent to Kong-routed /auth/register */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Email
                        </label>
                        <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
                        {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                    </div>

                    {/* Role Selection - Maps to backend 'role' enum */}
                    <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Role
                        </label>
                        <Select onValueChange={(value) => setValue("role", value as any)}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                                <SelectItem value="institute-admin">Institute Admin</SelectItem>
                                <SelectItem value="system-admin">System Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-sm font-medium text-destructive">{errors.role.message}</p>}
                    </div>

                    {/* Error Display */}
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {/* Submit Button - Disabled during API call to Kong */}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign Up
                    </Button>
                </form>

                {/* Link to Login Page */}
                <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                        Sign In
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
