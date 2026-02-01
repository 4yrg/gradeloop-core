'use server'

import { createSession, deleteSession } from '../lib/session'
import axios from 'axios'
import { z } from 'zod'
import { loginSchema, registerSchema } from '../features/auth/schemas/auth'

export type LoginState = {
    errors?: {
        email?: string[]
        _form?: string[]
    }
    success?: boolean
}

export type RegisterState = {
    errors?: {
        email?: string[]
        name?: string[]
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

    const { email } = validatedFields.data

    try {
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        console.log(`Requesting magic link at: ${authUrl}/login for ${email}`);

        await axios.post(`${authUrl}/login`, {
            email,
        }, {
            timeout: 5000
        });

        // Always return success for security (email enumeration prevention is handled by backend too)
        return {
            success: true,
        }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('Login API error:', error.response?.data || error.message);
            // Even on error, we might want to show success message or generic error?
            // If backend is down, show error.
            return {
                errors: {
                    _form: ['Service unavailable. Please try again later.'],
                },
            }
        }
        console.error('Unexpected login error:', error);
        return {
            errors: {
                _form: ['An error occurred. Please contact support.'],
            },
        }
    }
}

export async function register(data: z.infer<typeof registerSchema>): Promise<RegisterState> {
    const validatedFields = registerSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { email, name, role } = validatedFields.data

    try {
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        await axios.post(`${authUrl}/register`, {
            email,
            name,
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
            await axios.post(`${authUrl}/logout`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        // console.error("Backend logout failed:", error);
    }

    await deleteSession()
}

// Verification Action (Client calls this or direct API? Actions are server-side).
// We might need a verify action if we want to set the session cookie (httpOnly) from the server action.
// Yes, verify page should likely call a Server Action to exchange token for session and set cookie.

export async function verifyMagicLink(token: string) {
    try {
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        const response = await axios.post(`${authUrl}/magic-link/consume`, {
            token
        });

        const { access_token, role, email, user_id, full_name, refresh_token } = response.data;

        if (!access_token || !user_id) {
            return { error: "Invalid response from server" };
        }

        const user = {
            id: user_id,
            role: role,
            email: email,
            name: full_name,
        }

        await createSession(access_token, user)
        // refresh_token isn't currently used by createSession but could be stored if needed.

        return { success: true, user }
    } catch (error: any) {
        console.error("Verify Magic Link Error:", error);
        return { error: "Invalid or expired link" };
    }
}

export async function verifyEmail(token: string) {
    try {
        const authUrl = process.env.API_GATEWAY_URL || "http://localhost:8000/auth";
        const response = await axios.post(`${authUrl}/verify-email`, {
            token
        });

        // Assuming verify-email returns tokens for auto-login
        const { access_token, role, email, user_id, full_name } = response.data;

        if (access_token && user_id) {
            const user = {
                id: user_id,
                role: role,
                email: email,
                name: full_name,
            }
            await createSession(access_token, user)
            return { success: true, user }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Verify Email Error:", error);
        return { error: "Invalid or expired link" };
    }
}

