import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value
    const { pathname } = request.nextUrl

    const isAuthPage = pathname.startsWith('/auth')
    // Add other protected routes here. Assuming everything but auth and public assets is protected?
    // Or specifically /dashboard
    const isDashboardPage = pathname.startsWith('/dashboard')

    if (isDashboardPage && !session) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (isAuthPage && session) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
