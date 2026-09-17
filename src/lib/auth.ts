import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  // PrismaAdapter is only used when database is reachable.
  // On Vercel before env vars are set, this safely falls back to undefined.
  adapter: undefined as any, // Will be set lazily below

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

// Lazily set the PrismaAdapter when database is reachable.
// This avoids crashing at module-evaluation time on Vercel.
try {
  const { PrismaAdapter } = require('@auth/prisma-adapter')
  const { db } = require('@/lib/db')
  if (db) {
    authOptions.adapter = PrismaAdapter(db) as any
  }
} catch (error) {
  console.warn('[Auth] PrismaAdapter not available — running without DB adapter')
}
