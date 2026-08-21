'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'

interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>
}
