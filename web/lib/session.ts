import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createSession(token: string, user: any) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const cookieStore = await cookies()

    cookieStore.set('session', token, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })

    // Store basic user info in cookies for client-side access
    cookieStore.set('user_role', user.role, {
        httpOnly: false, // readable by client
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })

    cookieStore.set('user_email', user.email, {
        httpOnly: false,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })

    if (user.name) {
        cookieStore.set('user_name', user.name, {
            httpOnly: false,
            secure: true,
            expires: expiresAt,
            sameSite: 'lax',
            path: '/',
        })
    }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('user_role')
    cookieStore.delete('user_email')
    cookieStore.delete('user_name')
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    return session
}

export async function getUserFromSession() {
    const cookieStore = await cookies()
    return {
        role: cookieStore.get('user_role')?.value,
        email: cookieStore.get('user_email')?.value,
        name: cookieStore.get('user_name')?.value,
    }
}
