import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get('action');

    const report = await db.financialReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const where: { reportId: string; action?: string } = { reportId: id };
    if (actionFilter) {
      where.action = actionFilter;
    }

    const auditLogs = await db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
