import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js 16 Proxy — replaces the deprecated middleware.ts convention.
 *
 * Runs in Edge Runtime before routes are rendered.
 * Checks for the next-auth JWT session cookie to protect routes.
 * Full session validation happens server-side in layout.tsx via getServerSession().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes without authentication
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/logo.svg' ||
    pathname === '/api' ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // Check for next-auth session token cookie
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login|api|_next|public|favicon\\.ico|robots\\.txt|logo\\.svg).*)',
  ],
}
