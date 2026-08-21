import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  // Prisma adapter handles User + Account + Session models
  adapter: PrismaAdapter(db) as any,

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
    strategy: 'database',
    // Seconds — 7 days
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: '/login',
    // No separate sign-up — Google OAuth creates the account on first login
  },

  callbacks: {
    // Attach user id & role to the JWT (used for session.strategy = 'jwt')
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    // Attach id & role to the client-side session object
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id
        ;(session.user as any).role = (user as any).role ?? 'accountant'
      }
      return session
    },
  },

  // Auto-redirect to login page on error
  events: {
    signIn: async ({ user, isNewUser }) => {
      if (isNewUser) {
        console.log(`[Auth] New user signed up: ${user.email}`)
      }
    },
  },
}
