'use client'

import { signIn } from 'next-auth/react'
import { getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Landmark,
  Mail,
  Shield,
  BarChart3,
  ArrowRight,
  Lock,
  Globe,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const FEATURES = [
  {
    icon: Shield,
    title: 'IPSAS Compliant',
    desc: 'Full accrual-based financial statements meeting international standards',
  },
  {
    icon: BarChart3,
    title: '24+ Statement Tables',
    desc: 'Auto-generated from trial balance with cross-validation',
  },
  {
    icon: Lock,
    title: 'Secure & Auditable',
    desc: 'Complete audit trail, version history, and approval workflows',
  },
  {
    icon: Globe,
    title: 'Multi-Entity Support',
    desc: 'Manage multiple government entities with fund-level controls',
  },
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    setLoading(true)
    signIn('google', {
      callbackUrl: '/',
    })
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Panel: Branding & Features ──────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,0,0,0.02),transparent)]" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Landmark className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">GovAccounts</span>
              <span className="text-lg font-bold text-primary ml-1">ERP</span>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Government
              <br />
              <span className="text-primary">Financial Statements</span>
              <br />
              Generation System
            </h1>
            <p className="text-muted-foreground text-base max-w-md leading-relaxed">
              Complete accounting cycle management — from fund setup and budget
              control through books of entry, ledgers, trial balance, to
              IPSAS-compliant financial statements.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-3 rounded-lg border border-border/60 bg-card/80 backdrop-blur p-3.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <p className="text-xs text-muted-foreground">
            Trusted by government finance teams across multiple jurisdictions
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Landmark className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              GovAccounts <span className="text-primary">ERP</span>
            </span>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription>
                Sign in to your government accounting workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Google Sign-In Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-11 text-sm font-medium gap-2.5"
                size="lg"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <Separator />

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By signing in, you agree to our
                  {' '}<span className="text-foreground underline underline-offset-2 cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-foreground underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  First-time users will be automatically registered.
                  No separate sign-up needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secured with industry-standard OAuth 2.0 authentication</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}