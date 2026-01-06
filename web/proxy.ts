import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value
    const role = request.cookies.get('user_role')?.value
    const { pathname } = request.nextUrl

    // Define public routes (allowlist)
    const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/enroll', '/recognize'] // Add other public routes as needed
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')

    // 1. Redirect unauthenticated users trying to access protected pages (non-public) to login
    if (!isPublicRoute && !session) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Redirect authenticated users trying to access public auth pages to their dashboard
    // We allow access to '/' even if authenticated, so they can see the landing page. 
    // Only redirect if they are on explicitly auth-related pages like login/register
    const isAuthPage = pathname.startsWith('/auth/') || pathname === '/login' || pathname === '/register'
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
