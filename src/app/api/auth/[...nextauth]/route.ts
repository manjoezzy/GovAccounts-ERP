import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Wrap in try/catch so Vercel doesn't crash if auth config fails
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
