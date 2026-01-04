'use server'

import { createSession, deleteSession } from '@/lib/session'
import axios from 'axios'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
})

export type LoginState = {
    errors?: {
        email?: string[]
        password?: string[]
        _form?: string[]
    }
}

export async function login(prevState: LoginState, formData: FormData) {
    const validatedFields = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email, password } = validatedFields.data

    let user: any
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8080/auth";
        const response = await axios.post(`${authUrl}/login`, {
            email,
            password,
        });

        const { user: userData, token } = response.data;
        user = userData

        if (!user || !token) {
            return {
                errors: {
                    _form: ['Invalid response from server'],
                }
            }
        }

        await createSession(token, user)
    } catch (error: any) {
        console.error('Login error:', error.response?.data || error.message)
        return {
            errors: {
                _form: ['Invalid email or password'],
            },
        }
    }

    // Return success with redirect path based on role
    return {
        success: true,
        redirectTo: getRedirectPath(user.role)
    }
}

function getRedirectPath(role: string): string {
    switch (role) {
        case 'system-admin':
            return '/admin/system'
        case 'institute-admin':
            return '/admin/institute'
        case 'instructor':
            return '/instructor/courses'
        case 'student':
            return '/student/courses'
        default:
            return '/dashboard'
    }
}

export async function logout() {
    await deleteSession()
}

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email'),
})

export type ForgotPasswordState = {
    errors?: {
        email?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function forgotPassword(prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
    const validatedFields = forgotPasswordSchema.safeParse({
        email: formData.get('email'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email } = validatedFields.data

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8080/auth";
        const response = await axios.post(`${authUrl}/forgot-password`, {
            email,
        });

        return {
            success: true,
            message: response.data.message || 'If the email exists, a password reset link has been sent',
        }
    } catch (error: any) {
        console.error('Forgot password error:', error.response?.data || error.message)
        return {
            success: true, // Always return success to prevent email enumeration
            message: 'If the email exists, a password reset link has been sent',
        }
    }
}

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export type ResetPasswordState = {
    errors?: {
        token?: string[]
        password?: string[]
        confirmPassword?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function resetPassword(prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
    const validatedFields = resetPasswordSchema.safeParse({
        token: formData.get('token'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { token, password } = validatedFields.data

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8080/auth";
        const response = await axios.post(`${authUrl}/reset-password`, {
            token,
            password,
        });

        return {
            success: true,
            message: response.data.message || 'Password reset successful',
        }
    } catch (error: any) {
        console.error('Reset password error:', error.response?.data || error.message)
        return {
            errors: {
                _form: [error.response?.data?.error || 'Password reset failed. The link may have expired.'],
            },
        }
    }
}
