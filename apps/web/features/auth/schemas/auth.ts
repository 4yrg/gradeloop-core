import { z } from "zod"

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
})

export type LoginValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
})

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
