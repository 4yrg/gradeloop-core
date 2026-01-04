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

    // Optional: Store basic user info in a publicly readable cookie for client-side access (e.g. role)
    // Or just rely on client-side state management after login return
    cookieStore.set('user_role', user.role, {
        httpOnly: false, // readable by client
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('user_role')
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    return session
}
