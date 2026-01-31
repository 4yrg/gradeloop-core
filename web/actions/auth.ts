'use server'

import { createSession, deleteSession } from '../lib/session'
import axios from 'axios'
import { z } from 'zod'
import { forgotPasswordSchema, resetPasswordSchema } from '../features/auth/schemas/auth'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'instructor', 'institute-admin', 'system-admin']),
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
    let token: string | undefined
    let forceReset: boolean = false


    try {
        // Use service name if in docker, or host port if outside
        // Use API Gateway URL
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        console.log(`Attempting login at: ${authUrl}/login for ${email}`);

        const response = await axios.post(`${authUrl}/login`, {
            email,
            password,
        }, {
            timeout: 5000 // 5 second timeout
        });

        // Backend returns: { message, role, token, email }
        const { role, email: responseEmail } = response.data;
        token = response.data.token;

        if (!token || !role || !responseEmail) {
            console.error('Invalid response structure:', response.data);
            return {
                errors: {
                    _form: ['Invalid response from server: Missing fields'],
                }
            }
        }

        // Fetch Institute ID for Institute Admins
        let instituteId = null;
        if (role === 'INSTITUTE_ADMIN') {
            try {
                // Use API Gateway URL to fetch from user-service
                const gatewayUrl = process.env.API_GATEWAY_URL || "http://localhost:8000";

                // Fetch institute admin from user-service
                const adminRes = await axios.get(`${gatewayUrl}/users/institute-admins/by-email/${encodeURIComponent(email)}`);
                instituteId = adminRes.data.instituteId;

                console.log('Fetched institute ID from user-service:', instituteId);
            } catch (err) {
                console.error('Failed to fetch institute for admin:', err);
                // Non-blocking - admin might not have been created in user-service yet
            }
        }

        // Construct the user object for session creation
        user = {
            id: response.data.userId?.toString(),
            role: role,
            email: responseEmail,
            name: responseEmail.split('@')[0],
            instituteId: instituteId
        }

        // Handle forced reset scenario - do not create full session or mark as partial?
        // Actually, we likely need a session to allow them to access /change-password endpoint.
        // But maybe with a flag?
        // For simplicity, we create the session, but middleware redirects to /force-reset if forceReset is set.
        // We'll add forceReset to session state?
        if (response.data.forceReset) {
            user.forceReset = true;
            forceReset = true;
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

    // Return success with token and user data
    return {
        success: true,
        token,
        user,
        forceReset: forceReset,
        redirectTo: forceReset ? '/auth/force-reset' : getRedirectPath(user.role)
    }
}



function getRedirectPath(role: string): string {
    switch (role) {
        case 'SYSTEM_ADMIN':
            return '/system-admin'
        case 'INSTITUTE_ADMIN':
            return '/institute-admin/dashboard'
        case 'INSTRUCTOR':
            return '/instructor'
        case 'STUDENT':
            return '/student'
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
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
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
    try {
        const { getSession } = await import('../lib/session');
        const token = await getSession();
        if (token) {
            const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
            // Call backend logout to invalidate session in Redis
            // Spring Security default logout is usually POST /logout
            await axios.post(`${authUrl}/logout`, {}, {
                headers: {
                    'Cookie': `JSESSIONID=${token}` // Assuming standard Spring Session
                }
            });
        }
    } catch (error) {
        // console.error("Backend logout failed:", error);
        // Continue to clear local session anyway
    }

    await deleteSession()
}


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
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
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
    const validatedFields = resetPasswordSchema.safeParse({
        password: data.password,
        confirmPassword: data.confirmPassword
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { password } = validatedFields.data
    const token = data.token

    try {
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        const response = await axios.post(`${authUrl}/reset-password`, {
            token,
            newPassword: password,
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


export type ChangePasswordState = {
    errors?: {
        currentPassword?: string[]
        newPassword?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function changePassword(data: { currentPassword: string, newPassword: string }): Promise<ChangePasswordState> {
    // Basic validation
    if (!data.currentPassword || !data.newPassword) {
        return {
            errors: {
                _form: ['Current and new password are required']
            }
        }
    }

    try {
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        const { getSession } = await import('../lib/session');
        const sessionToken = await getSession();
        if (!sessionToken) {
            return { errors: { _form: ['Unauthorized'] } }
        }

        const response = await axios.post(`${authUrl}/change-password`, {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        }, {
            headers: {
                'Cookie': `JSESSIONID=${sessionToken}` // Assuming standard Spring Session
            }
        });

        return {
            success: true,
            message: 'Password changed successfully'
        }

    } catch (error: any) {
        console.error("Change Password Error:", error);
        if (axios.isAxiosError(error)) {
            console.error("Axios Status:", error.response?.status);
            console.error("Axios Data:", error.response?.data);
            return {
                errors: {
                    _form: [error.response?.data?.message || error.response?.data || 'Failed to change password']
                }
            }
        }
        return {
            errors: {
                _form: ['An unexpected error occurred.']
            }
        }
    }
}
