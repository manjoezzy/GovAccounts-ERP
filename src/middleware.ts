import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect all routes except public ones
export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    // Match everything except login, auth API, and static assets
    '/((?!login|api/auth|_next|public|favicon\.ico|robots\.txt|logo\.svg).*)',
  ],
}
