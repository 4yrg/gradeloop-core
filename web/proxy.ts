import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value ?? ''
    const role = request.cookies.get('user_role')?.value ?? ''
    const { pathname } = request.nextUrl



    // Define public routes (allowlist)
    const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/enroll', '/recognize', '/verify'] // Add other public routes as needed
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')

    // 1. Redirect unauthenticated users trying to access protected pages (non-public) to login
    if (!isPublicRoute && !session) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Redirect authenticated users trying to access public auth pages to their dashboard
    // We allow access to '/' even if authenticated, so they can see the landing page. 
    // Only redirect if they are on explicitly auth-related pages like login/register
    const isAuthPage = (pathname.startsWith('/auth/') && pathname !== '/auth/force-reset') || pathname === '/login' || pathname === '/register'
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
    // 3. Strict Role-Based Access Control
    // Prevent users from accessing paths belonging to other roles
    if (session && role && !isPublicRoute) {
        // Define role-specific path prefixes
        const rolePaths: Record<string, string> = {
            'SYSTEM_ADMIN': '/system-admin',
            'INSTITUTE_ADMIN': '/institute-admin',
            'INSTRUCTOR': '/instructor',
            'STUDENT': '/student'
        }

        // Type guard: only proceed if role is a valid key in rolePaths
        if (role in rolePaths) {
            const currentRolePath = rolePaths[role]

            // If the current path belongs to a DIFFERENT role, redirect to the user's correct dashboard
            for (const [r, pathPrefix] of Object.entries(rolePaths)) {
                if (r !== role && pathname.startsWith(pathPrefix)) {
                    // Determine the correct target for the current user
                    let target = '/dashboard'
                    if (role === 'SYSTEM_ADMIN') target = '/system-admin'
                    else if (role === 'INSTITUTE_ADMIN') target = '/institute-admin/dashboard'
                    else if (role === 'INSTRUCTOR') target = '/instructor'
                    else if (role === 'STUDENT') target = '/student'

                    return NextResponse.redirect(new URL(target, request.url))
                }
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
