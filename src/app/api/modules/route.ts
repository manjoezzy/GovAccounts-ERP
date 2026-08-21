import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// MODULE REGISTRY
// Maps query param module names → Prisma model property names
// ═══════════════════════════════════════════════════════════════════

interface ModuleConfig {
  /** The property name on the Prisma client (e.g. db.votebookEntry) */
  model: string;
  /** Whether the model has a direct reportId field */
  hasReportId: boolean;
  /** For journal: include related JournalLine records */
  includeLines?: boolean;
  /** For ledger-tx: relation path to reach reportId via parent */
  nestedReportPath?: string;
}

const MODULE_MAP: Record<string, ModuleConfig> = {
  'votebook':          { model: 'votebookEntry',        hasReportId: true },
  'warrant':           { model: 'warrant',              hasReportId: true },
  'virement':          { model: 'virement',             hasReportId: true },
  'commitment':        { model: 'commitment',           hasReportId: true },
  'procurement':       { model: 'procurementPlan',      hasReportId: true },
  'journal':           { model: 'journalEntry',         hasReportId: true, includeLines: true },
  'petty-cash':        { model: 'pettyCashTransaction', hasReportId: true },
  'imprest':           { model: 'imprest',              hasReportId: true },
  'cashbook':          { model: 'cashbookEntry',        hasReportId: true },
  'cashbook-opening':  { model: 'cashbookOpeningBalance', hasReportId: true },
  'bank-recon':        { model: 'bankReconciliation',   hasReportId: true },
  'ledger-account':    { model: 'ledgerAccount',        hasReportId: true },
  'ledger-tx':         { model: 'ledgerTransaction',    hasReportId: false, nestedReportPath: 'account' },
  'payroll':           { model: 'payrollEntry',         hasReportId: true },
  'tax':               { model: 'taxEntry',             hasReportId: true },
  'grant':             { model: 'grantEntry',           hasReportId: true },
  'debt':              { model: 'debtEntry',            hasReportId: true },
  'cheque':            { model: 'chequeEntry',          hasReportId: true },
  'suspense':          { model: 'suspenseAccount',      hasReportId: true },
  'revenue':           { model: 'revenueEntry',         hasReportId: true },
  'expenditure':       { model: 'expenditureEntry',     hasReportId: true },
  'appropriation':     { model: 'appropriationAccount', hasReportId: true },
  'inter-fund':        { model: 'interFundTransfer',    hasReportId: true },
  'asset':             { model: 'assetRegister',        hasReportId: true },
  'inventory':         { model: 'inventoryItem',        hasReportId: true },
  'debtor':            { model: 'debtorAccount',        hasReportId: true },
  'creditor':          { model: 'creditorAccount',      hasReportId: true },
  'closing-entry':     { model: 'closingEntry',         hasReportId: true },
  'year-end-checklist':{ model: 'yearEndChecklist',     hasReportId: true },
  'fund':              { model: 'fund',                 hasReportId: true },
  'notification':      { model: 'notification',         hasReportId: true },
};

const VALID_MODULES = new Set(Object.keys(MODULE_MAP));

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get the Prisma model delegate for a given module name */
function getModel(moduleName: string): any {
  const config = MODULE_MAP[moduleName];
  if (!config) return null;
  return (db as any)[config.model];
}

/** Build a Prisma `where` clause for list/detail queries */
function buildWhereClause(
  config: ModuleConfig,
  id?: string,
  reportId?: string,
): Record<string, any> {
  const where: Record<string, any> = {};

  if (id) {
    where.id = id;
  }

  if (reportId) {
    if (config.hasReportId) {
      where.reportId = reportId;
    } else if (config.nestedReportPath) {
      // e.g. LedgerTransaction → filter via parent LedgerAccount.reportId
      where[config.nestedReportPath] = { reportId };
    }
  }

  return where;
}

/** Build the `include` options based on module config */
function buildInclude(config: ModuleConfig): Record<string, any> | undefined {
  if (config.includeLines) {
    return { lines: { orderBy: { sortOrder: 'asc' } } };
  }
  return undefined;
}

/** Strip `lines` from the body so it doesn't leak into the main model create/update */
function stripLines(body: Record<string, any>): { data: Record<string, any>; lines: any[] } {
  const { lines, ...data } = body;
  return { data, lines: Array.isArray(lines) ? lines : [] };
}

/**
 * Synchronise journal lines for a JournalEntry (create / update / delete).
 * Lines WITH an `id` are treated as existing records (update).
 * Lines WITHOUT an `id` are created.
 * Lines present in DB but missing from the payload are deleted.
 */
async function syncJournalLines(
  journalId: string,
  incomingLines: any[],
): Promise<void> {
  const existingLines = await db.journalLine.findMany({
    where: { journalId },
    select: { id: true },
  });

  const existingIds = new Set(existingLines.map((l) => l.id));
  const incomingIds = new Set(
    incomingLines.filter((l) => l.id).map((l) => l.id),
  );

  // Delete lines that exist in DB but are not in the payload
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await db.journalLine.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Upsert each incoming line
  for (const line of incomingLines) {
    const { id, ...lineData } = line;
    if (id && existingIds.has(id)) {
      await db.journalLine.update({
        where: { id },
        data: { ...lineData, journalId },
      });
    } else {
      await db.journalLine.create({
        data: { ...lineData, journalId },
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// ERROR RESPONSE HELPER
// ═══════════════════════════════════════════════════════════════════

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// ═══════════════════════════════════════════════════════════════════
// GET — List or single record
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module');
  const id = searchParams.get('id');
  const reportId = searchParams.get('reportId');
  const accountId = searchParams.get('accountId');

  // ── Validate module ──────────────────────────────────────────
  if (!moduleName || !VALID_MODULES.has(moduleName)) {
    return errorResponse(
      `Invalid or missing module. Valid modules: ${[...VALID_MODULES].join(', ')}`,
      400,
    );
  }

  const config = MODULE_MAP[moduleName];
  const model = getModel(moduleName);
  if (!model) {
    return errorResponse('Module model not found.', 500);
  }

  try {
    // ── Single record by ID ────────────────────────────────────
    if (id) {
      const where = buildWhereClause(config, id);
      const include = buildInclude(config);

      const record = await model.findUnique({ where, include });
      if (!record) {
        return errorResponse(`${moduleName} record with id "${id}" not found.`, 404);
      }
      return NextResponse.json(record);
    }

    // ── List records ───────────────────────────────────────────
    const where = buildWhereClause(config, undefined, reportId ?? undefined);
    const include = buildInclude(config);

    // Support accountId filter (e.g. ledger-tx filtered by parent account)
    if (accountId) {
      where.accountId = accountId;
    }

    const records = await model.findMany({
      where,
      include: include || undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error(`[GET /api/modules?module=${moduleName}]`, error);
    return errorResponse(
      error.message || 'Failed to fetch records.',
      500,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST — Create a new record
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module');

  if (!moduleName || !VALID_MODULES.has(moduleName)) {
    return errorResponse(
      `Invalid or missing module. Valid modules: ${[...VALID_MODULES].join(', ')}`,
      400,
    );
  }

  const config = MODULE_MAP[moduleName];
  const model = getModel(moduleName);
  if (!model) {
    return errorResponse('Module model not found.', 500);
  }

  try {
    const body = await request.json();

    // ── Journal: handle lines separately ───────────────────────
    if (config.includeLines) {
      const { data, lines } = stripLines(body);

      const record = await model.create({ data });

      // Create all journal lines
      if (lines.length > 0) {
        await db.journalLine.createMany({
          data: lines.map((line: any, index: number) => ({
            ...line,
            journalId: record.id,
            sortOrder: line.sortOrder ?? index,
          })),
        });
      }

      // Return the full record with lines
      const fullRecord = await model.findUnique({
        where: { id: record.id },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
      return NextResponse.json(fullRecord, { status: 201 });
    }

    // ── Standard create ────────────────────────────────────────
    const record = await model.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error(`[POST /api/modules?module=${moduleName}]`, error);

    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      return errorResponse(`Unique constraint violation on: ${target}`, 409);
    }
    if (error.code === 'P2003') {
      return errorResponse('Foreign key constraint failed. Check referenced records exist.', 400);
    }

    return errorResponse(
      error.message || 'Failed to create record.',
      500,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUT — Update an existing record
// ═══════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module');
  const id = searchParams.get('id');

  if (!moduleName || !VALID_MODULES.has(moduleName)) {
    return errorResponse(
      `Invalid or missing module. Valid modules: ${[...VALID_MODULES].join(', ')}`,
      400,
    );
  }

  if (!id) {
    return errorResponse('Missing required query parameter: id', 400);
  }

  const config = MODULE_MAP[moduleName];
  const model = getModel(moduleName);
  if (!model) {
    return errorResponse('Module model not found.', 500);
  }

  try {
    const body = await request.json();

    // ── Verify record exists ───────────────────────────────────
    const where = buildWhereClause(config, id);
    const existing = await model.findUnique({ where });
    if (!existing) {
      return errorResponse(`${moduleName} record with id "${id}" not found.`, 404);
    }

    // ── Journal: handle lines separately ───────────────────────
    if (config.includeLines) {
      const { data, lines } = stripLines(body);

      // Remove id from data to prevent overwriting the primary key
      const { id: _id, ...updateData } = data;

      await model.update({ where: { id }, data: updateData });

      // Sync journal lines (create / update / delete)
      await syncJournalLines(id, lines);

      // Return the full updated record with lines
      const fullRecord = await model.findUnique({
        where: { id },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
      return NextResponse.json(fullRecord);
    }

    // ── Standard update ────────────────────────────────────────
    const { id: _id, ...updateData } = body;
    const record = await model.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(record);
  } catch (error: any) {
    console.error(`[PUT /api/modules?module=${moduleName}&id=${id}]`, error);

    if (error.code === 'P2025') {
      return errorResponse(`${moduleName} record with id "${id}" not found.`, 404);
    }
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      return errorResponse(`Unique constraint violation on: ${target}`, 409);
    }
    if (error.code === 'P2003') {
      return errorResponse('Foreign key constraint failed. Check referenced records exist.', 400);
    }

    return errorResponse(
      error.message || 'Failed to update record.',
      500,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// DELETE — Remove a record
// ═══════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module');
  const id = searchParams.get('id');

  if (!moduleName || !VALID_MODULES.has(moduleName)) {
    return errorResponse(
      `Invalid or missing module. Valid modules: ${[...VALID_MODULES].join(', ')}`,
      400,
    );
  }

  if (!id) {
    return errorResponse('Missing required query parameter: id', 400);
  }

  const config = MODULE_MAP[moduleName];
  const model = getModel(moduleName);
  if (!model) {
    return errorResponse('Module model not found.', 500);
  }

  try {
    // ── Verify record exists ───────────────────────────────────
    const where = buildWhereClause(config, id);
    const existing = await model.findUnique({ where });
    if (!existing) {
      return errorResponse(`${moduleName} record with id "${id}" not found.`, 404);
    }

    // ── Delete (cascade handles child records like JournalLines) 
    await model.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error(`[DELETE /api/modules?module=${moduleName}&id=${id}]`, error);

    if (error.code === 'P2025') {
      return errorResponse(`${moduleName} record with id "${id}" not found.`, 404);
    }
    if (error.code === 'P2003') {
      return errorResponse(
        'Cannot delete: this record is referenced by other records.',
        409,
      );
    }

    return errorResponse(
      error.message || 'Failed to delete record.',
      500,
    );
  }
}
