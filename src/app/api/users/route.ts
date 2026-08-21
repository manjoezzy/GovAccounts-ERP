import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/users — list all users (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any)?.role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// PATCH /api/users — update a user's role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any)?.role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || !newRole || !['admin', 'accountant', 'viewer'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    return NextResponse.json({ id: updated.id, role: updated.role })
  } catch (error: any) {
    console.error('[PATCH /api/users]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
