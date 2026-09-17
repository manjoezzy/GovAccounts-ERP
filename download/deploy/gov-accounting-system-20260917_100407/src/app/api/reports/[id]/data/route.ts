import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// UNIFIED EDITABLE DATA API
// GET    /api/reports/[id]/data?module=<module>          — fetch
// POST   /api/reports/[id]/data  { module, data }        — create
// PUT    /api/reports/[id]/data  { module, entryId, updates } — update
// DELETE /api/reports/[id]/data?module=<module>&entryId=<id>  — delete
//
// Supports ALL 16 modules for full editability
// ═══════════════════════════════════════════════════════════════

type ModuleName =
  | 'trialBalance' | 'supplementary' | 'funds' | 'votebook'
  | 'warrants' | 'virements' | 'commitments' | 'procurement'
  | 'journal' | 'pettyCash' | 'imprest' | 'cashbook'
  | 'bankReconciliation' | 'ledger' | 'payroll' | 'tax'
  | 'grants' | 'debt' | 'cheques' | 'suspense'
  | 'revenue' | 'expenditure' | 'appropriation' | 'interFundTransfers'
  | 'assets' | 'inventory' | 'debtors' | 'creditors'
  | 'closingEntries' | 'approval';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const module = url.searchParams.get('module') as ModuleName;
    if (!module) return NextResponse.json({ error: 'Missing ?module= parameter' }, { status: 400 });

    let data: any;
    switch (module) {
      case 'trialBalance': data = await db.trialBalanceEntry.findMany({ where: { reportId: id }, orderBy: { sortOrder: 'asc' } }); break;
      case 'supplementary': data = await db.supplementaryData.findUnique({ where: { reportId: id } }); break;
      case 'funds': data = await db.fund.findMany({ where: { reportId: id } }); break;
      case 'votebook': data = await db.votebookEntry.findMany({ where: { reportId: id } }); break;
      case 'warrants': data = await db.warrant.findMany({ where: { reportId: id } }); break;
      case 'virements': data = await db.virement.findMany({ where: { reportId: id } }); break;
      case 'commitments': data = await db.commitment.findMany({ where: { reportId: id } }); break;
      case 'procurement': data = await db.procurementPlan.findMany({ where: { reportId: id } }); break;
      case 'journal': data = await db.journalEntry.findMany({ where: { reportId: id }, include: { lines: { orderBy: { sortOrder: 'asc' } } }, orderBy: { createdAt: 'desc' } }); break;
      case 'pettyCash': data = await db.pettyCashTransaction.findMany({ where: { reportId: id } }); break;
      case 'imprest': data = await db.imprest.findMany({ where: { reportId: id } }); break;
      case 'cashbook': data = { openingBalances: await db.cashbookOpeningBalance.findMany({ where: { reportId: id } }), entries: await db.cashbookEntry.findMany({ where: { reportId: id }, orderBy: { createdAt: 'asc' } }) }; break;
      case 'bankReconciliation': data = await db.bankReconciliation.findMany({ where: { reportId: id } }); break;
      case 'ledger': data = await db.ledgerAccount.findMany({ where: { reportId: id }, include: { transactions: { orderBy: { createdAt: 'asc' } } } }); break;
      case 'payroll': data = await db.payrollEntry.findMany({ where: { reportId: id } }); break;
      case 'tax': data = await db.taxEntry.findMany({ where: { reportId: id } }); break;
      case 'grants': data = await db.grantEntry.findMany({ where: { reportId: id } }); break;
      case 'debt': data = await db.debtEntry.findMany({ where: { reportId: id } }); break;
      case 'cheques': data = await db.chequeEntry.findMany({ where: { reportId: id } }); break;
      case 'suspense': data = await db.suspenseAccount.findMany({ where: { reportId: id } }); break;
      case 'revenue': data = await db.revenueEntry.findMany({ where: { reportId: id } }); break;
      case 'expenditure': data = await db.expenditureEntry.findMany({ where: { reportId: id } }); break;
      case 'appropriation': data = await db.appropriationAccount.findMany({ where: { reportId: id } }); break;
      case 'interFundTransfers': data = await db.interFundTransfer.findMany({ where: { reportId: id } }); break;
      case 'assets': data = await db.assetRegister.findMany({ where: { reportId: id } }); break;
      case 'inventory': data = await db.inventoryItem.findMany({ where: { reportId: id } }); break;
      case 'debtors': data = await db.debtorAccount.findMany({ where: { reportId: id } }); break;
      case 'creditors': data = await db.creditorAccount.findMany({ where: { reportId: id } }); break;
      case 'closingEntries': data = await db.closingEntry.findMany({ where: { reportId: id } }); break;
      case 'approval': data = await db.approvalWorkflow.findUnique({ where: { reportId: id } }); break;
      default: return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 });
    }
    return NextResponse.json({ module, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { module, entryId, updates } = body as { module: ModuleName; entryId?: string; updates: Record<string, any> };
    if (!module || !updates) return NextResponse.json({ error: 'Missing module or updates' }, { status: 400 });

    let result: any;
    // For modules that use upsert (singleton per report)
    const isSingleton = module === 'supplementary' || module === 'approval';

    if (isSingleton) {
      if (module === 'supplementary') {
        result = await db.supplementaryData.upsert({ where: { reportId: id }, update: updates, create: { reportId: id, ...updates } });
      } else {
        result = await db.approvalWorkflow.upsert({ where: { reportId: id }, update: updates, create: { reportId: id, ...updates } });
      }
    } else {
      if (!entryId) return NextResponse.json({ error: 'entryId required for this module' }, { status: 400 });
      const modelMap: Record<string, any> = {
        trialBalance: db.trialBalanceEntry, funds: db.fund, votebook: db.votebookEntry,
        warrants: db.warrant, virements: db.virement, commitments: db.commitment,
        procurement: db.procurementPlan, journal: db.journalEntry, pettyCash: db.pettyCashTransaction,
        imprest: db.imprest, cashbook: db.cashbookEntry, bankReconciliation: db.bankReconciliation,
        ledger: db.ledgerAccount, payroll: db.payrollEntry, tax: db.taxEntry,
        grants: db.grantEntry, debt: db.debtEntry, cheques: db.chequeEntry,
        suspense: db.suspenseAccount, revenue: db.revenueEntry, expenditure: db.expenditureEntry,
        appropriation: db.appropriationAccount, interFundTransfers: db.interFundTransfer,
        assets: db.assetRegister, inventory: db.inventoryItem, debtors: db.debtorAccount,
        creditors: db.creditorAccount, closingEntries: db.closingEntry,
      };
      const model = modelMap[module];
      if (!model) return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 });
      result = await model.update({ where: { id: entryId }, data: updates });
    }

    await db.auditLog.create({ data: { reportId: id, action: 'update', field: `${module}${entryId ? `.${entryId}` : ''}`, oldValue: '', newValue: JSON.stringify(Object.keys(updates)), userId: 'user' } });
    return NextResponse.json({ success: true, module, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { module, data: entryData } = body as { module: ModuleName; data: Record<string, any> };
    if (!module || !entryData) return NextResponse.json({ error: 'Missing module or data' }, { status: 400 });

    const reportData = { reportId: id, ...entryData };
    const modelMap: Record<string, any> = {
      trialBalance: db.trialBalanceEntry, funds: db.fund, votebook: db.votebookEntry,
      warrants: db.warrant, virements: db.virement, commitments: db.commitment,
      procurement: db.procurementPlan, journal: db.journalEntry, pettyCash: db.pettyCashTransaction,
      imprest: db.imprest, cashbook: db.cashbookEntry, bankReconciliation: db.bankReconciliation,
      ledger: db.ledgerAccount, payroll: db.payrollEntry, tax: db.taxEntry,
      grants: db.grantEntry, debt: db.debtEntry, cheques: db.chequeEntry,
      suspense: db.suspenseAccount, revenue: db.revenueEntry, expenditure: db.expenditureEntry,
      appropriation: db.appropriationAccount, interFundTransfers: db.interFundTransfer,
      assets: db.assetRegister, inventory: db.inventoryItem, debtors: db.debtorAccount,
      creditors: db.creditorAccount, closingEntries: db.closingEntry,
    };
    const model = modelMap[module];
    if (!model) return NextResponse.json({ error: `Cannot create in module: ${module}` }, { status: 400 });

    const result = await model.create({ data: reportData });
    await db.auditLog.create({ data: { reportId: id, action: 'create', field: module, oldValue: '', newValue: `Created new ${module} entry`, userId: 'user' } });
    return NextResponse.json({ success: true, module, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const module = url.searchParams.get('module') as ModuleName;
    const entryId = url.searchParams.get('entryId');
    if (!module || !entryId) return NextResponse.json({ error: 'Missing module or entryId' }, { status: 400 });

    const modelMap: Record<string, any> = {
      trialBalance: db.trialBalanceEntry, funds: db.fund, votebook: db.votebookEntry,
      warrants: db.warrant, virements: db.virement, commitments: db.commitment,
      procurement: db.procurementPlan, journal: db.journalEntry, pettyCash: db.pettyCashTransaction,
      imprest: db.imprest, cashbook: db.cashbookEntry, bankReconciliation: db.bankReconciliation,
      ledger: db.ledgerAccount, payroll: db.payrollEntry, tax: db.taxEntry,
      grants: db.grantEntry, debt: db.debtEntry, cheques: db.chequeEntry,
      suspense: db.suspenseAccount, revenue: db.revenueEntry, expenditure: db.expenditureEntry,
      appropriation: db.appropriationAccount, interFundTransfers: db.interFundTransfer,
      assets: db.assetRegister, inventory: db.inventoryItem, debtors: db.debtorAccount,
      creditors: db.creditorAccount, closingEntries: db.closingEntry,
    };
    const model = modelMap[module];
    if (!model) return NextResponse.json({ error: `Cannot delete from module: ${module}` }, { status: 400 });

    const result = await model.delete({ where: { id: entryId } });
    await db.auditLog.create({ data: { reportId: id, action: 'delete', field: `${module}.${entryId}`, oldValue: 'deleted', newValue: '', userId: 'user' } });
    return NextResponse.json({ success: true, module, deleted: entryId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
