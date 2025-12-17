import { z } from "zod"

export const LoginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
})

export const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
})

export type LoginFormValues = z.infer<typeof LoginSchema>
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>
