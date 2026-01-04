'use server'

import { createSession, deleteSession } from '@/lib/session'
import axios from 'axios'
import { z } from 'zod'

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
})

export type LoginState = {
    errors?: {
        username?: string[]
        password?: string[]
        _form?: string[]
    }
}

export async function login(prevState: LoginState, formData: FormData) {
    const validatedFields = loginSchema.safeParse({
        username: formData.get('username'),
        password: formData.get('password'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { username, password } = validatedFields.data

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8080/auth";
        const response = await axios.post(`${authUrl}/login`, {
            username,
            password,
        });

        const { user, token } = response.data;

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
                _form: ['Invalid username or password'],
            },
        }
    }

    // Redirect must happen outside try/catch if it throws (Next.js redirection throws)
    // or return a success flag for client to handle.
    // BUT: createSession sets cookies. We can just return success:true? 
    // Standard server action pattern:
    return { success: true }
}

export async function logout() {
    await deleteSession()
}
