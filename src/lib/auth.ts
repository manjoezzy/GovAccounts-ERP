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
    // JWT strategy is required for Vercel Edge Runtime compatibility.
    // Database strategy crashes middleware because Prisma/SQLite
    // cannot run in Edge functions.
    strategy: 'jwt',
    // Seconds — 7 days
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: '/login',
    // No separate sign-up — Google OAuth creates the account on first login
  },

  callbacks: {
    // Attach user id & role to the JWT token
    async jwt({ token, user, trigger, session }) {
      // On first sign-in, persist user info into the JWT
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'accountant'
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      // When session is updated (e.g. role change), refresh the JWT
      if (trigger === 'update' && session) {
        token.role = (session as any).role ?? token.role
        token.name = (session as any).name ?? token.name
      }
      return token
    },
    // Expose id & role from the JWT to the client-side session
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

  // Auto-redirect to login page on error
  events: {
    signIn: async ({ user, isNewUser }) => {
      if (isNewUser) {
        console.log(`[Auth] New user signed up: ${user.email}`)
      }
    },
  },
}
