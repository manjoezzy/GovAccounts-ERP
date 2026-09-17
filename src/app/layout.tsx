import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/components/auth-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "GovAccounts ERP - Government Accounting System",
  description:
    "Complete government accounting ERP with IPSAS-compliant financial statements, budgeting, ledgers, and full accounting cycle management.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Try to get server session, but never crash — even if DB is unreachable
  // (e.g., on first Vercel deployment before env vars are configured)
  let session = null
  try {
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")
    session = await getServerSession(authOptions)
  } catch {
    // Silently fail — app will render without session
    // Users will see the login page via proxy.ts redirect
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider session={session}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
