import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value
    const role = request.cookies.get('user_role')?.value
    const { pathname } = request.nextUrl

    // Define paths
    const isAuthPage = pathname.startsWith('/auth') || pathname === '/login'

    // Define protected routes pattern
    const protectedRoutes = [
        '/dashboard',
        '/system-admin',
        '/institute-admin',
        '/instructor',
        '/student'
    ]
    const isProtectedPage = protectedRoutes.some(route => pathname.startsWith(route))

    // 1. Redirect unauthenticated users trying to access protected pages to login
    if (isProtectedPage && !session) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // 2. Redirect authenticated users trying to access auth pages to their dashboard
    if (isAuthPage && session && role) {
        let target = '/dashboard'
        switch (role) {
            case 'SYSTEM_ADMIN':
                target = '/system-admin'
                break
            case 'INSTITUTE_ADMIN':
                target = '/institute-admin/dashboard'
                break
            case 'INSTRUCTOR':
                target = '/instructor'
                break
            case 'STUDENT':
                target = '/student'
                break
        }
        return NextResponse.redirect(new URL(target, request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
