import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

interface BulkEntity {
  entityName: string;
  periodEnd: string;
  periodLabel: string;
  currency?: string;
  entries: {
    accountCode: string;
    accountName: string;
    classification: string;
    category: string;
    noteRef?: string;
    debitCurrent?: number;
    creditCurrent?: number;
    debitPrior?: number;
    creditPrior?: number;
    budgetInitial?: number;
    budgetAdjusted?: number;
  }[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entities: BulkEntity[] = body.entities;

    if (!Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json({ error: 'entities array is required and must not be empty' }, { status: 400 });
    }

    if (entities.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 entities per bulk operation' }, { status: 400 });
    }

    const results: { entityName: string; reportId: string; entryCount: number; error?: string }[] = [];

    for (const entity of entities) {
      try {
        const report = await db.financialReport.create({
          data: {
            entityName: entity.entityName || 'Government Entity',
            periodEnd: entity.periodEnd || '2025-06-30',
            periodLabel: entity.periodLabel || '30 June 2025',
            currency: entity.currency || 'Shs',
            status: 'complete',
            entries: {
              create: (entity.entries || []).map((entry, index) => ({
                accountCode: String(entry.accountCode || ''),
                accountName: String(entry.accountName || ''),
                classification: String(entry.classification || 'revenue-non-exchange'),
                category: String(entry.category || ''),
                noteRef: String(entry.noteRef || ''),
                debitCurrent: Number(entry.debitCurrent || 0),
                creditCurrent: Number(entry.creditCurrent || 0),
                debitPrior: Number(entry.debitPrior || 0),
                creditPrior: Number(entry.creditPrior || 0),
                budgetInitial: Number(entry.budgetInitial || 0),
                budgetAdjusted: Number(entry.budgetAdjusted || 0),
                sortOrder: index,
              })),
            },
          },
        });

        results.push({
          entityName: entity.entityName,
          reportId: report.id,
          entryCount: (entity.entries || []).length,
        });
      } catch (err) {
        results.push({
          entityName: entity.entityName,
          reportId: '',
          entryCount: 0,
          error: String(err),
        });
      }
    }

    const successCount = results.filter(r => !r.error).length;

    return NextResponse.json({
      total: entities.length,
      successCount,
      failureCount: entities.length - successCount,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
