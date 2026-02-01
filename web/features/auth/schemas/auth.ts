import { z } from "zod"

// Login now only requires email
export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
})

export type LoginValues = z.infer<typeof loginSchema>

// Registration now only requires name, email, role
export const registerSchema = z
    .object({
        name: z.string().min(2, { message: "Name must be at least 2 characters" }),
        email: z.string().email({ message: "Invalid email address" }),
        role: z.enum(["student", "instructor", "institute-admin", "system-admin"], {
            message: "Please select a valid role",
        }),
    })

export type RegisterValues = z.infer<typeof registerSchema>

