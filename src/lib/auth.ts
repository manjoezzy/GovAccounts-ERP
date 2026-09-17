import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  // Prisma adapter handles User + Account + Session models.
  // Wrapped in try/catch so the app doesn't crash if DB is unreachable
  // (e.g., on first Vercel deployment before env vars are set).
  adapter: (() => {
    try {
      return PrismaAdapter(db) as any
    } catch {
      return undefined
    }
  })(),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  session: {
    // JWT strategy is required for Vercel Edge Runtime compatibility.
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'accountant'
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      if (trigger === 'update' && session) {
        token.role = (session as any).role ?? token.role
        token.name = (session as any).name ?? token.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role ?? 'accountant'
        ;(session.user as any).email = token.email
        ;(session.user as any).name = token.name
        ;(session.user as any).picture = token.picture
      }
      return session
    },
  },

  events: {
    signIn: async ({ user, isNewUser }) => {
      if (isNewUser) {
        console.log(`[Auth] New user signed up: ${user.email}`)
      }
    },
  },
}
