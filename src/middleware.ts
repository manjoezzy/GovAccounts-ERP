import { NextRequest, NextResponse } from 'next/server'

// Simple session guard — checks for the next-auth JWT cookie.
// With JWT strategy, no database call is needed in Edge Runtime.
// The full session is validated server-side in layout.tsx via getServerSession().
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/logo.svg'
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
    '/((?!login|api/auth|_next|public|favicon\.ico|robots\.txt|logo\.svg).*)',
  ],
}
