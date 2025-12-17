"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Code, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginSchema, LoginFormValues } from "@/schemas/auth"
import { useUserStore, UserRole } from "@/store/useUserStore"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useUserStore()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true)

        // Simulate API Call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Mock Logic
        let role: UserRole = "STUDENT"
        let name = "Alex Student"

        if (data.email.includes("admin")) {
            role = "ADMIN"
            name = "System Admin"
        } else if (data.email.includes("instructor")) {
            role = "INSTRUCTOR"
            name = "Dr. Sarah Teacher"
        }

        login({
            id: "123",
            email: data.email,
            name,
            roles: [role],
            currentRole: role
        })

        toast.success(`Welcome back, ${name}`)

        // Redirect based on role
        if (role === "ADMIN") router.push("/admin")
        else if (role === "INSTRUCTOR") router.push("/instructor")
        else router.push("/student")

        setIsLoading(false)
    }

    return (
        <Card className="w-full shadow-lg border-primary/20 bg-background/95 backdrop-blur">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Code className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Sign in to GradeLoop</CardTitle>
                <CardDescription>
                    Enter your academic credentials to access the platform
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
                                        <Input placeholder="student@university.edu" {...field} />
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
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 text-sm text-center text-muted-foreground">
                <div className="text-xs">
                    <p>Demo Credentials:</p>
                    <p>student@gradeloop.com / password</p>
                    <p>instructor@gradeloop.com / password</p>
                </div>
            </CardFooter>
        </Card>
    )
}
