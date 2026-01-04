'use server'

import { createSession, deleteSession } from '@/lib/session'
import axios from 'axios'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'instructor', 'institute-admin']),
})

export type LoginState = {
    errors?: {
        email?: string[]
        password?: string[]
        _form?: string[]
    }
}

export type RegisterState = {
    errors?: {
        email?: string[]
        name?: string[]
        password?: string[]
        role?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function login(data: z.infer<typeof loginSchema>) {
    const validatedFields = loginSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email, password } = validatedFields.data

    let user: any
    try {
        // Use service name if in docker, or host port if outside
        const authUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:5000/auth";
        console.log(`Attempting login at: ${authUrl}/login for ${email}`);

        const response = await axios.post(`${authUrl}/login`, {
            email,
            password,
        }, {
            timeout: 5000 // 5 second timeout
        });

        const { user: userData, token } = response.data;
        user = userData

        if (!user || !token) {
            console.error('Invalid response structure:', response.data);
            return {
                errors: {
                    _form: ['Invalid response from server'],
                }
            }
        }

        await createSession(token, user)
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('Login API error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Invalid email or password';
            return {
                errors: {
                    _form: [errorMessage],
                },
            }
        }
        console.error('Unexpected login error:', error);
        return {
            errors: {
                _form: ['An error occurred during login. Please contact support.'],
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

export async function register(data: z.infer<typeof registerSchema>): Promise<RegisterState> {
    const validatedFields = registerSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email, name, password, role } = validatedFields.data

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:5000/auth";
        await axios.post(`${authUrl}/register`, {
            email,
            name,
            password,
            role,
        })

        return { success: true }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('Registration API error:', error.response?.data || error.message);
            return {
                errors: {
                    _form: [error.response?.data?.error || 'Registration failed'],
                },
            }
        }
        console.error('Unexpected registration error:', error)
        return {
            errors: {
                _form: ['Registration failed. Please try again.'],
            },
        }
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

export async function forgotPassword(data: z.infer<typeof forgotPasswordSchema>): Promise<ForgotPasswordState> {
    const validatedFields = forgotPasswordSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email } = validatedFields.data

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:5000/auth";
        const response = await axios.post(`${authUrl}/forgot-password`, {
            email,
        });

        return {
            success: true,
            message: response.data.message || 'If the email exists, a password reset link has been sent',
        }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('Forgot password API error:', error.response?.data || error.message);
        } else {
            console.error('Unexpected forgot password error:', error);
        }
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

export async function resetPassword(data: { token: string } & z.infer<typeof resetPasswordSchema>): Promise<ResetPasswordState> {
    const validatedFields = resetPasswordSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { password } = validatedFields.data
    const token = data.token

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:5000/auth";
        const response = await axios.post(`${authUrl}/reset-password`, {
            token,
            password,
        });

        return {
            success: true,
            message: response.data.message || 'Password reset successful',
        }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('Reset password API error:', error.response?.data || error.message);
            return {
                errors: {
                    _form: [error.response?.data?.error || 'Password reset failed. The link may have expired.'],
                },
            }
        }
        console.error('Unexpected reset password error:', error);
        return {
            errors: {
                _form: ['An unexpected error occurred. Please try again.'],
            },
        }
    }
}
