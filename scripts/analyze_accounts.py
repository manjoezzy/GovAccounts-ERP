#!/usr/bin/env python3
"""
Accuracy Analysis of Madera Accounts adjusted (1).docx
Checks arithmetic accuracy, cross-referencing, and consistency
across all financial statements.
"""

from docx import Document
import json
import re

doc = Document('/home/z/my-project/upload/Madera Accounts adjusted (1).docx')

def parse_num(s):
    """Parse a number string like '1,234,567' or '-' or '' to int."""
    if s is None:
        return None
    s = str(s).strip()
    # Handle negative in parentheses
    m = re.match(r'^\(([\d,]+)\)$', s)
    if m:
        return -int(m.group(1).replace(',', ''))
    s = s.replace(',', '')
    if s in ('', '-', '0', '00', '( )'):
        return 0
    try:
        return int(s)
    except ValueError:
        return None

def fmt(n):
    """Format number with commas."""
    if n is None:
        return 'N/A'
    if n < 0:
        return f'({abs(n):,.0f})'
    return f'{n:,.0f}'

# Extract all tables
tables = []
for table in doc.tables:
    t = []
    for row in table.rows:
        cells = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
        t.append(cells)
    tables.append(t)

errors = []
warnings = []

# ========================================
# TABLE 2: Statement of Financial Performance
# ========================================
t2 = tables[1]  # Table 2 (0-indexed, Table 1 is blank)

# Revenue items
rev_2025 = {
    'Taxes': parse_num(t2[3][2]),
    'External Assistance': parse_num(t2[4][2]),
    'Transfers from Treasury-UCF': parse_num(t2[5][2]),
    'Transfers from Contingencies Fund': parse_num(t2[6][2]),
    'Transfers from other Govt Units': parse_num(t2[7][2]),
    'Non-Tax revenue-Exchange Transaction': parse_num(t2[8][2]),
    'Sub-total Exchange transactions': parse_num(t2[9][2]),
    'Revenue in kind': parse_num(t2[10][2]),
    'Non-Tax Revenue-Exchange': parse_num(t2[11][2]),
    'Sub-total exchange transactions (2)': parse_num(t2[12][2]),
}

rev_2024 = {
    'Taxes': parse_num(t2[3][3]),
    'External Assistance': parse_num(t2[4][3]),
    'Transfers from Treasury-UCF': parse_num(t2[5][3]),
    'Transfers from Contingencies Fund': parse_num(t2[6][3]),
    'Transfers from other Govt Units': parse_num(t2[7][3]),
    'Non-Tax revenue-Exchange Transaction': parse_num(t2[8][3]),
    'Sub-total Exchange transactions': parse_num(t2[9][3]),
    'Revenue in kind': parse_num(t2[10][3]),
    'Non-Tax Revenue-Exchange': parse_num(t2[11][3]),
    'Sub-total exchange transactions (2)': parse_num(t2[12][3]),
}

reported_total_rev_2025 = parse_num(t2[13][2])  # 1,144,235,244
reported_total_rev_2024 = parse_num(t2[13][3])  # 1,449,952,907

# Non-exchange revenue subtotal
non_exch_2025 = rev_2025['Taxes'] + rev_2025['External Assistance'] + rev_2025['Transfers from Treasury-UCF'] + rev_2025['Transfers from Contingencies Fund'] + rev_2025['Transfers from other Govt Units'] + rev_2025['Non-Tax revenue-Exchange Transaction']
non_exch_2024 = rev_2024['Taxes'] + rev_2024['External Assistance'] + rev_2024['Transfers from Treasury-UCF'] + rev_2024['Transfers from Contingencies Fund'] + rev_2024['Transfers from other Govt Units'] + rev_2024['Non-Tax revenue-Exchange Transaction']

# CHECK 1: Total Revenue 2025
calc_total_rev_2025 = non_exch_2025 + rev_2025['Sub-total Exchange transactions'] + rev_2025['Revenue in kind'] + rev_2025['Non-Tax Revenue-Exchange'] + rev_2025['Sub-total exchange transactions (2)']
if calc_total_rev_2025 != reported_total_rev_2025:
    errors.append(f"Total Revenue 2025: Reported {fmt(reported_total_rev_2025)} != Calculated {fmt(calc_total_rev_2025)} (difference: {fmt(calc_total_rev_2025 - reported_total_rev_2025)})")

# CHECK 1b: Total Revenue 2024
calc_total_rev_2024 = non_exch_2024 + rev_2024['Sub-total Exchange transactions'] + rev_2024['Revenue in kind'] + rev_2024['Non-Tax Revenue-Exchange'] + rev_2024['Sub-total exchange transactions (2)']
if calc_total_rev_2024 != reported_total_rev_2024:
    errors.append(f"Total Revenue 2024: Reported {fmt(reported_total_rev_2024)} != Calculated {fmt(calc_total_rev_2024)} (difference: {fmt(calc_total_rev_2024 - reported_total_rev_2024)})")

# Expenses
exp_2025 = {
    'Compensation of employees': parse_num(t2[16][2]),
    'Goods and services consumed': parse_num(t2[17][2]),
    'Depreciation expense': parse_num(t2[18][2]),
    'Impairment of PPE': parse_num(t2[19][2]),
    'Subsidies': parse_num(t2[20][2]),
    'Grants and other transfers': parse_num(t2[21][2]),
    'Social benefits': parse_num(t2[22][2]),
    'Finance costs': parse_num(t2[23][2]),
    'Bad debts expense': parse_num(t2[24][2]),
    'Other expenses': parse_num(t2[25][2]),
}

exp_2024 = {
    'Compensation of employees': parse_num(t2[16][3]),
    'Goods and services consumed': parse_num(t2[17][3]),
    'Depreciation expense': parse_num(t2[18][3]),
    'Impairment of PPE': parse_num(t2[19][3]),
    'Subsidies': parse_num(t2[20][3]),
    'Grants and other transfers': parse_num(t2[21][3]),
    'Social benefits': parse_num(t2[22][3]),
    'Finance costs': parse_num(t2[23][3]),
    'Bad debts expense': parse_num(t2[24][3]),
    'Other expenses': parse_num(t2[25][3]),
}

reported_total_exp_2025 = parse_num(t2[26][2])
reported_total_exp_2024 = parse_num(t2[26][3])

# CHECK 2: Total Expenses
calc_total_exp_2025 = sum(exp_2025.values())
if calc_total_exp_2025 != reported_total_exp_2025:
    errors.append(f"Total Expenses 2025: Reported {fmt(reported_total_exp_2025)} != Calculated {fmt(calc_total_exp_2025)} (difference: {fmt(calc_total_exp_2025 - reported_total_exp_2025)})")

# CHECK 2b
calc_total_exp_2024 = sum(exp_2024.values())
if calc_total_exp_2024 != reported_total_exp_2024:
    errors.append(f"Total Expenses 2024: Reported {fmt(reported_total_exp_2024)} != Calculated {fmt(calc_total_exp_2024)} (difference: {fmt(calc_total_exp_2024 - reported_total_exp_2024)})")

# CHECK 3: Surplus/Deficit
reported_surplus_2025 = parse_num(t2[30][2])
reported_surplus_2024 = parse_num(t2[30][3])

calc_surplus_2025 = reported_total_rev_2025 - reported_total_exp_2025
calc_surplus_2024 = reported_total_rev_2024 - reported_total_exp_2024

if calc_surplus_2025 != reported_surplus_2025:
    errors.append(f"Surplus/Deficit 2025: Reported {fmt(reported_surplus_2025)} != Revenue {fmt(reported_total_rev_2025)} - Expenses {fmt(reported_total_exp_2025)} = {fmt(calc_surplus_2025)} (difference: {fmt(calc_surplus_2025 - reported_surplus_2025)})")

if calc_surplus_2024 != reported_surplus_2024:
    errors.append(f"Surplus/Deficit 2024: Reported {fmt(reported_surplus_2024)} != Revenue {fmt(reported_total_rev_2024)} - Expenses {fmt(reported_total_exp_2024)} = {fmt(calc_surplus_2024)} (difference: {fmt(calc_surplus_2024 - reported_surplus_2024)})")

# ========================================
# TABLE 3: Statement of Financial Position
# ========================================
t3 = tables[2]

assets_2025 = {
    'Cash': parse_num(t3[3][2]),
    'Prepayments (current)': parse_num(t3[4][2]),
    'Receivables (current)': parse_num(t3[5][2]),
    'Inventories': parse_num(t3[6][2]),
    'Prepayments (non-current)': parse_num(t3[9][2]),
    'Receivables (non-current)': parse_num(t3[10][2]),
    'Investments': parse_num(t3[11][2]),
    'PPE': parse_num(t3[12][2]),
    'Investment property': parse_num(t3[13][2]),
    'Intangible assets': parse_num(t3[14][2]),
    'Non-Produced Assets': parse_num(t3[15][2]),
}

assets_2024 = {
    'Cash': parse_num(t3[3][3]),
    'Prepayments (current)': parse_num(t3[4][3]),
    'Receivables (current)': parse_num(t3[5][3]),
    'Inventories': parse_num(t3[6][3]),
    'Prepayments (non-current)': parse_num(t3[9][3]),
    'Receivables (non-current)': parse_num(t3[10][3]),
    'Investments': parse_num(t3[11][3]),
    'PPE': parse_num(t3[12][3]),
    'Investment property': parse_num(t3[13][3]),
    'Intangible assets': parse_num(t3[14][3]),
    'Non-Produced Assets': parse_num(t3[15][3]),
}

reported_total_assets_2025 = parse_num(t3[16][2])
reported_total_assets_2024 = parse_num(t3[16][3])

calc_total_assets_2025 = sum(v for v in assets_2025.values() if v is not None)
calc_total_assets_2024 = sum(v for v in assets_2024.values() if v is not None)

if calc_total_assets_2025 != reported_total_assets_2025:
    errors.append(f"Total Assets 2025: Reported {fmt(reported_total_assets_2025)} != Sum of asset items {fmt(calc_total_assets_2025)} (difference: {fmt(calc_total_assets_2025 - reported_total_assets_2025)})")

if calc_total_assets_2024 != reported_total_assets_2024:
    errors.append(f"Total Assets 2024: Reported {fmt(reported_total_assets_2024)} != Sum of asset items {fmt(calc_total_assets_2024)} (difference: {fmt(calc_total_assets_2024 - reported_total_assets_2024)})")

# Liabilities
liabilities_2025 = {
    'Payables (current)': parse_num(t3[20][2]),
    'Deposits (current)': parse_num(t3[21][2]),
    'Short-term borrowings': parse_num(t3[22][2]),
    'Pensions (current)': parse_num(t3[23][2]),
    'Payables (non-current)': parse_num(t3[26][2]),
    'Deposits (non-current)': parse_num(t3[27][2]),
    'Long-term borrowings': parse_num(t3[28][2]),
    'Pensions (non-current)': parse_num(t3[29][2]),
}

liabilities_2024 = {
    'Payables (current)': parse_num(t3[20][3]),
    'Deposits (current)': parse_num(t3[21][3]),
    'Short-term borrowings': parse_num(t3[22][3]),
    'Pensions (current)': parse_num(t3[23][3]),
    'Payables (non-current)': parse_num(t3[26][3]),
    'Deposits (non-current)': parse_num(t3[27][3]),
    'Long-term borrowings': parse_num(t3[28][3]),
    'Pensions (non-current)': parse_num(t3[29][3]),
}

reported_total_liab_2025 = parse_num(t3[30][2])
reported_total_liab_2024 = parse_num(t3[30][3])

calc_total_liab_2025 = sum(v for v in liabilities_2025.values() if v is not None)
calc_total_liab_2024 = sum(v for v in liabilities_2024.values() if v is not None)

if calc_total_liab_2025 != reported_total_liab_2025:
    errors.append(f"Total Liabilities 2025: Reported {fmt(reported_total_liab_2025)} != Sum of liability items {fmt(calc_total_liab_2025)} (difference: {fmt(calc_total_liab_2025 - reported_total_liab_2025)})")

if calc_total_liab_2024 != reported_total_liab_2024:
    errors.append(f"Total Liabilities 2024: Reported {fmt(reported_total_liab_2024)} != Sum of liability items {fmt(calc_total_liab_2024)} (difference: {fmt(calc_total_liab_2024 - reported_total_liab_2024)})")

# Net Assets
reported_net_assets_2025 = parse_num(t3[31][2])
reported_net_assets_2024 = parse_num(t3[31][3])
reported_reserves_2025 = parse_num(t3[34][2])
reported_reserves_2024 = parse_num(t3[34][3])

calc_net_assets_2025 = reported_total_assets_2025 - reported_total_liab_2025
calc_net_assets_2024 = reported_total_assets_2024 - reported_total_liab_2024

if calc_net_assets_2025 != reported_net_assets_2025:
    errors.append(f"Net Assets 2025: Reported {fmt(reported_net_assets_2025)} != Assets {fmt(reported_total_assets_2025)} - Liabilities {fmt(reported_total_liab_2025)} = {fmt(calc_net_assets_2025)}")

if calc_net_assets_2024 != reported_net_assets_2024:
    errors.append(f"Net Assets 2024: Reported {fmt(reported_net_assets_2024)} != Assets {fmt(reported_total_assets_2024)} - Liabilities {fmt(reported_total_liab_2024)} = {fmt(calc_net_assets_2024)}")

if reported_reserves_2025 != reported_net_assets_2025:
    errors.append(f"Reserves 2025: Reported {fmt(reported_reserves_2025)} != Net Assets {fmt(reported_net_assets_2025)}")

if reported_reserves_2024 != reported_net_assets_2024:
    errors.append(f"Reserves 2024: Reported {fmt(reported_reserves_2024)} != Net Assets {fmt(reported_net_assets_2024)}")

# ========================================
# TABLE 4: Statement of Changes in Net Assets
# ========================================
t4 = tables[3]

bf_2025 = parse_num(t4[1][2])
adj_2025 = parse_num(t4[3][2])
surplus_add_2025 = parse_num(t4[5][2])
closing_na_2025 = parse_num(t4[6][2])

bf_2024 = parse_num(t4[1][3])
adj_2024 = parse_num(t4[3][3])
surplus_add_2024 = parse_num(t4[5][3])
closing_na_2024 = parse_num(t4[6][3])

# Closing = B/F + Adjustments + Surplus
calc_closing_2025 = bf_2025 + (adj_2025 if adj_2025 else 0) + surplus_add_2025
if calc_closing_2025 != closing_na_2025:
    errors.append(f"Closing Net Assets 2025: Reported {fmt(closing_na_2025)} != B/F {fmt(bf_2025)} + Adj {fmt(adj_2025)} + Surplus {fmt(surplus_add_2025)} = {fmt(calc_closing_2025)} (difference: {fmt(calc_closing_2025 - closing_na_2025)})")

calc_closing_2024 = bf_2024 + (adj_2024 if adj_2024 else 0) + surplus_add_2024
if calc_closing_2024 != closing_na_2024:
    errors.append(f"Closing Net Assets 2024: Reported {fmt(closing_na_2024)} != B/F {fmt(bf_2024)} + Adj {fmt(adj_2024)} + Surplus {fmt(surplus_add_2024)} = {fmt(calc_closing_2024)} (difference: {fmt(calc_closing_2024 - closing_na_2024)})")

# B/F 2025 = Closing 2024
if bf_2025 != closing_na_2024:
    errors.append(f"Opening Net Assets 2025 (B/F {fmt(bf_2025)}) != Closing Net Assets 2024 ({fmt(closing_na_2024)}). Discrepancy: {fmt(bf_2025 - closing_na_2024)}")

# ========================================
# TABLE 5: Cash Flow Statement
# ========================================
t5 = tables[4]

rev_operating_2025 = parse_num(t5[2][2])
comp_emp_cf_2025 = parse_num(t5[4][2])
goods_cf_2025 = parse_num(t5[5][2])
other_exp_cf_2025 = parse_num(t5[8][2])
other_advances_cf_2025 = parse_num(t5[10][2])
reported_net_operating_2025 = parse_num(t5[17][2])

rev_operating_2024 = parse_num(t5[2][3])
comp_emp_cf_2024 = parse_num(t5[4][3])
goods_cf_2024 = parse_num(t5[5][3])
other_exp_cf_2024 = parse_num(t5[8][3])
other_advances_cf_2024 = parse_num(t5[10][3])
reported_net_operating_2024 = parse_num(t5[17][3])

# Net cash from operating = Revenue - Payments
calc_net_op_2025 = rev_operating_2025 - comp_emp_cf_2025 - goods_cf_2025 - other_exp_cf_2025 - (other_advances_cf_2025 if other_advances_cf_2025 else 0)
if calc_net_op_2025 != reported_net_operating_2025:
    errors.append(f"Net Cash from Operating 2025: Reported {fmt(reported_net_operating_2025)} != Revenue {fmt(rev_operating_2025)} - Compensation {fmt(comp_emp_cf_2025)} - Goods {fmt(goods_cf_2025)} - Other {fmt(other_exp_cf_2025)} = {fmt(calc_net_op_2025)} (difference: {fmt(calc_net_op_2025 - reported_net_operating_2025)})")

calc_net_op_2024 = rev_operating_2024 - comp_emp_cf_2024 - goods_cf_2024 - other_exp_cf_2024 - (other_advances_cf_2024 if other_advances_cf_2024 else 0)
if calc_net_op_2024 != reported_net_operating_2024:
    errors.append(f"Net Cash from Operating 2024: Reported {fmt(reported_net_operating_2024)} != Revenue {fmt(rev_operating_2024)} - Compensation {fmt(comp_emp_cf_2024)} - Goods {fmt(goods_cf_2024)} - Other {fmt(other_exp_cf_2024)} - Advances {fmt(other_advances_cf_2024)} = {fmt(calc_net_op_2024)} (difference: {fmt(calc_net_op_2024 - reported_net_operating_2024)})")

# Investing
purchase_ppe_2025 = parse_num(t5[19][2])
reported_net_investing_2025 = parse_num(t5[25][2])

# Financing
reported_net_financing_2025 = parse_num(t5[32][2])

# Net change
reported_net_change_2025 = parse_num(t5[33][2])
reported_net_change_2024 = parse_num(t5[33][3])

# CHECK: Net change = Operating + Investing + Financing
calc_net_change_2025 = reported_net_operating_2025 + (purchase_ppe_2025 if purchase_ppe_2025 else 0) + (reported_net_financing_2025 if reported_net_financing_2025 else 0)
if calc_net_change_2025 != reported_net_change_2025:
    errors.append(f"Net Cash Change 2025: Reported {fmt(reported_net_change_2025)} != Operating {fmt(reported_net_operating_2025)} + Investing {fmt(purchase_ppe_2025)} + Financing {fmt(reported_net_financing_2025)} = {fmt(calc_net_change_2025)} (difference: {fmt(calc_net_change_2025 - reported_net_change_2025)})")

# ========================================
# TABLE 6: Revenue Reconciliation for Cash Flow
# ========================================
t6 = tables[5]

sfp_rev_2025 = parse_num(t6[1][2])
advances_2025 = parse_num(t6[2][2])
rev_receivable_2025 = parse_num(t6[3][2])
deposits_2025 = parse_num(t6[4][2])
total_rev_cf_2025 = parse_num(t6[5][2])
rev_in_kind_2025 = parse_num(t6[7][2])
transfers_treasury_2025 = parse_num(t6[8][2])
rev_receivable_period_2025 = parse_num(t6[9][2])
total_rev_cashflow_2025 = parse_num(t6[10][2])

sfp_rev_2024 = parse_num(t6[1][3])
advances_2024 = parse_num(t6[2][3])
rev_receivable_2024 = parse_num(t6[3][3])
deposits_2024 = parse_num(t6[4][3])
total_rev_cf_2024 = parse_num(t6[5][3])
rev_in_kind_2024 = parse_num(t6[7][3])
rev_receivable_period_2024 = parse_num(t6[9][3])
total_rev_cashflow_2024 = parse_num(t6[10][3])

# CHECK: Total Revenue CF = SFP Revenue + Advances + Receivable + Deposits
calc_total_rev_cf_2025 = sfp_rev_2025 + (advances_2025 if advances_2025 else 0) + (rev_receivable_2025 if rev_receivable_2025 else 0) + (deposits_2025 if deposits_2025 else 0)
if calc_total_rev_cf_2025 != total_rev_cf_2025:
    errors.append(f"Total Revenue for CF 2025: Reported {fmt(total_rev_cf_2025)} != SFP Rev {fmt(sfp_rev_2025)} + Advances {fmt(advances_2025)} + Rev Receivable {fmt(rev_receivable_2025)} = {fmt(calc_total_rev_cf_2025)} (difference: {fmt(calc_total_rev_cf_2025 - total_rev_cf_2025)})")

calc_total_rev_cf_2024 = sfp_rev_2024 + (advances_2024 if advances_2024 else 0) + (rev_receivable_2024 if rev_receivable_2024 else 0) + (deposits_2024 if deposits_2024 else 0)
if calc_total_rev_cf_2024 != total_rev_cf_2024:
    errors.append(f"Total Revenue for CF 2024: Reported {fmt(total_rev_cf_2024)} != SFP Rev {fmt(sfp_rev_2024)} + Rev Receivable {fmt(rev_receivable_2024)} = {fmt(calc_total_rev_cf_2024)} (difference: {fmt(calc_total_rev_cf_2024 - total_rev_cf_2024)})")

# CHECK: Revenue for Cash Flow = Total Rev CF - Rev in Kind - Transfers
calc_cf_rev_2025 = total_rev_cf_2025 - (rev_in_kind_2025 if rev_in_kind_2025 else 0) - (transfers_treasury_2025 if transfers_treasury_2025 else 0)
if calc_cf_rev_2025 != total_rev_cashflow_2025:
    errors.append(f"Revenue for Cash Flow Purposes 2025: Reported {fmt(total_rev_cashflow_2025)} != {fmt(total_rev_cf_2025)} - Rev in Kind {fmt(rev_in_kind_2025)} = {fmt(calc_cf_rev_2025)} (difference: {fmt(calc_cf_rev_2025 - total_rev_cashflow_2025)})")

calc_cf_rev_2024 = total_rev_cf_2024 - (rev_in_kind_2024 if rev_in_kind_2024 else 0)
if calc_cf_rev_2024 != total_rev_cashflow_2024:
    errors.append(f"Revenue for Cash Flow Purposes 2024: Reported {fmt(total_rev_cashflow_2024)} != {fmt(total_rev_cf_2024)} - Rev in Kind {fmt(rev_in_kind_2024)} = {fmt(calc_cf_rev_2024)} (difference: {fmt(calc_cf_rev_2024 - total_rev_cashflow_2024)})")

# Cross-ref: Revenue for CF purposes vs CF statement
if total_rev_cashflow_2025 != rev_operating_2025:
    errors.append(f"Cross-Reference CF Revenue 2025: Table 6 ({fmt(total_rev_cashflow_2025)}) != Table 5 operating revenue ({fmt(rev_operating_2025)}). Difference: {fmt(total_rev_cashflow_2025 - rev_operating_2025)}")

if total_rev_cashflow_2024 != rev_operating_2024:
    errors.append(f"Cross-Reference CF Revenue 2024: Table 6 ({fmt(total_rev_cashflow_2024)}) != Table 5 operating revenue ({fmt(rev_operating_2024)}). Difference: {fmt(total_rev_cashflow_2024 - rev_operating_2024)}")

# ========================================
# TABLE 7: Cash Reconciliation
# ========================================
t7 = tables[6]

opening_cash_2025 = parse_num(t7[1][2])
net_change_cf_2025 = parse_num(t7[4][2])
closing_cash_2025 = parse_num(t7[5][2])

opening_cash_2024 = parse_num(t7[1][3])
net_change_cf_2024 = parse_num(t7[4][3])
closing_cash_2024 = parse_num(t7[5][3])

calc_closing_cash_2025 = opening_cash_2025 + net_change_cf_2025
if calc_closing_cash_2025 != closing_cash_2025:
    errors.append(f"Cash Reconciliation 2025: Opening {fmt(opening_cash_2025)} + Net Change {fmt(net_change_cf_2025)} = {fmt(calc_closing_cash_2025)} != Closing {fmt(closing_cash_2025)}. Difference: {fmt(calc_closing_cash_2025 - closing_cash_2025)}")

calc_closing_cash_2024 = opening_cash_2024 + net_change_cf_2024
if calc_closing_cash_2024 != closing_cash_2024:
    errors.append(f"Cash Reconciliation 2024: Opening {fmt(opening_cash_2024)} + Net Change {fmt(net_change_cf_2024)} = {fmt(calc_closing_cash_2024)} != Closing {fmt(closing_cash_2024)}. Difference: {fmt(calc_closing_cash_2024 - closing_cash_2024)}")

# ========================================
# TABLE 8: Cash Note
# ========================================
t8 = tables[7]
cash_note_2025 = parse_num(t8[1][2])
cash_note_2024 = parse_num(t8[1][3])

if cash_note_2025 != assets_2025['Cash']:
    errors.append(f"Cash Note 2025 ({fmt(cash_note_2025)}) != Balance Sheet Cash ({fmt(assets_2025['Cash'])}). Difference: {fmt(cash_note_2025 - assets_2025['Cash'])}")

if cash_note_2024 != assets_2024['Cash']:
    errors.append(f"Cash Note 2024 ({fmt(cash_note_2024)}) != Balance Sheet Cash ({fmt(assets_2024['Cash'])}). Difference: {fmt(cash_note_2024 - assets_2024['Cash'])}")

# ========================================
# Cross-checks
# ========================================

# Opening cash 2025 should equal closing cash 2024 (from BS)
if opening_cash_2025 != assets_2024['Cash']:
    errors.append(f"Opening Cash 2025 ({fmt(opening_cash_2025)}) != Closing Cash 2024 per BS ({fmt(assets_2024['Cash'])}). Difference: {fmt(opening_cash_2025 - assets_2024['Cash'])}")

# SFP Revenue in Table 6 vs Total Revenue in Table 2
if sfp_rev_2025 != reported_total_rev_2025:
    diff = sfp_rev_2025 - reported_total_rev_2025
    if rev_2025['Revenue in kind'] and diff == rev_2025['Revenue in kind']:
        errors.append(f"SFP Revenue in Table 6 ({fmt(sfp_rev_2025)}) != Total Revenue in Table 2 ({fmt(reported_total_rev_2025)}). The difference of {fmt(diff)} equals Revenue in Kind ({fmt(rev_2025['Revenue in kind'])}), suggesting Revenue in Kind is included in Table 6 but excluded from Table 2 total. This inconsistency needs resolution.")
    else:
        errors.append(f"SFP Revenue in Table 6 ({fmt(sfp_rev_2025)}) != Total Revenue in Table 2 ({fmt(reported_total_rev_2025)}). Difference: {fmt(diff)}")

# Goods & Services in CF vs SFP
if goods_cf_2025 != exp_2025['Goods and services consumed']:
    errors.append(f"Goods & Services in CF 2025 ({fmt(goods_cf_2025)}) != SFP ({fmt(exp_2025['Goods and services consumed'])}). Difference: {fmt(goods_cf_2025 - exp_2025['Goods and services consumed'])}")

if goods_cf_2024 != exp_2024['Goods and services consumed']:
    errors.append(f"Goods & Services in CF 2024 ({fmt(goods_cf_2024)}) != SFP ({fmt(exp_2024['Goods and services consumed'])}). Difference: {fmt(goods_cf_2024 - exp_2024['Goods and services consumed'])}")

# Treasury Transfers Note vs SFP
if len(tables) > 16:
    t15 = tables[16]
    treasury_note_2025 = parse_num(t15[1][1]) if len(t15) > 1 else None
    treasury_note_2024 = parse_num(t15[1][2]) if len(t15) > 1 else None
    if treasury_note_2024 is not None and treasury_note_2024 != rev_2024['Transfers from Treasury-UCF']:
        errors.append(f"Treasury Transfers Note 2024 ({fmt(treasury_note_2024)}) != SFP ({fmt(rev_2024['Transfers from Treasury-UCF'])}). Difference: {fmt(treasury_note_2024 - rev_2024['Transfers from Treasury-UCF'])}")

# Budget Variance check
if len(tables) > 8:
    t9 = tables[8]
    budget_actual_treasury = parse_num(t9[4][4])
    budget_revised_treasury = parse_num(t9[4][3])
    budget_variance_treasury = parse_num(t9[4][5])
    calc_variance = budget_revised_treasury - budget_actual_treasury
    if calc_variance != 0 and (budget_variance_treasury is None or budget_variance_treasury == 0):
        errors.append(f"Budget Variance (Treasury UCF): Variance is shown as {fmt(budget_variance_treasury)} but should be {fmt(calc_variance)} (Revised {fmt(budget_revised_treasury)} - Actual {fmt(budget_actual_treasury)})")

# Employee costs note vs SFP
if len(tables) > 22:
    t21 = tables[22]
    for row in t21:
        if 'Total employee costs' in str(row[0]):
            emp_note_2025 = parse_num(row[1]) if len(row) > 1 else None
            emp_note_2024 = parse_num(row[2]) if len(row) > 2 else None
            if emp_note_2025 is not None and emp_note_2025 != exp_2025['Compensation of employees']:
                errors.append(f"Employee Costs Note 2025 ({fmt(emp_note_2025)}) != SFP ({fmt(exp_2025['Compensation of employees'])}). Difference: {fmt(emp_note_2025 - exp_2025['Compensation of employees'])}")
            if emp_note_2024 is not None and emp_note_2024 != exp_2024['Compensation of employees']:
                errors.append(f"Employee Costs Note 2024 ({fmt(emp_note_2024)}) != SFP ({fmt(exp_2024['Compensation of employees'])}). Difference: {fmt(emp_note_2024 - exp_2024['Compensation of employees'])}")

# Goods & Services note vs SFP
if len(tables) > 23:
    t22 = tables[23]
    for row in t22:
        if 'Total cost of goods' in str(row[0]):
            goods_note_2025 = parse_num(row[1]) if len(row) > 1 else None
            goods_note_2024 = parse_num(row[2]) if len(row) > 2 else None
            if goods_note_2025 is not None and goods_note_2025 != exp_2025['Goods and services consumed']:
                errors.append(f"Goods & Services Note 2025 ({fmt(goods_note_2025)}) != SFP ({fmt(exp_2025['Goods and services consumed'])}). Difference: {fmt(goods_note_2025 - exp_2025['Goods and services consumed'])}")
            if goods_note_2024 is not None and goods_note_2024 != exp_2024['Goods and services consumed']:
                errors.append(f"Goods & Services Note 2024 ({fmt(goods_note_2024)}) != SFP ({fmt(exp_2024['Goods and services consumed'])}). Difference: {fmt(goods_note_2024 - exp_2024['Goods and services consumed'])}")

# Depreciation note vs SFP
if len(tables) > 24:
    t23 = tables[24]
    for row in t23:
        if str(row[0]).strip() == 'Total':
            dep_note_2025 = parse_num(row[1]) if len(row) > 1 else None
            if dep_note_2025 is not None and dep_note_2025 != exp_2025['Depreciation expense']:
                errors.append(f"Depreciation Note 2025 ({fmt(dep_note_2025)}) != SFP ({fmt(exp_2025['Depreciation expense'])}). Difference: {fmt(dep_note_2025 - exp_2025['Depreciation expense'])}")

# Revenue classification issue
if rev_2025['Non-Tax Revenue-Exchange'] != 0 and rev_2025['Sub-total exchange transactions (2)'] == 0:
    errors.append(f"Revenue Classification 2025: Non-Tax Revenue-Exchange is {fmt(rev_2025['Non-Tax Revenue-Exchange'])} but the second Sub-total Revenue from exchange transactions is {fmt(rev_2025['Sub-total exchange transactions (2)'])}. The subtotal should include this figure.")

# Expenditure per CF statement vs SFP
if len(tables) > 11:
    t12 = tables[11]
    for row in t12:
        if 'Total Expenditure' in str(row[0]):
            total_exp_cf_2025 = parse_num(row[1]) if len(row) > 1 else None
            total_exp_cf_2024 = parse_num(row[2]) if len(row) > 2 else None
            # CF expenditure should be different from SFP (excludes depreciation)
            if total_exp_cf_2025 is not None:
                sfp_exp_less_dep = reported_total_exp_2025 - exp_2025['Depreciation expense']
                if total_exp_cf_2025 != sfp_exp_less_dep:
                    warnings.append(f"Total Expenditure per CF 2025 ({fmt(total_exp_cf_2025)}) vs SFP less Depreciation ({fmt(sfp_exp_less_dep)}). Difference: {fmt(total_exp_cf_2025 - sfp_exp_less_dep)}")

# ========================================
# Summary
# ========================================
print("=" * 80)
print("MADERA ACCOUNTS - ACCURACY ANALYSIS")
print("=" * 80)
print(f"\nTotal ERRORS: {len(errors)}")
print(f"Total WARNINGS/NOTES: {len(warnings)}")
print()

if errors:
    print("\n" + "#" * 80)
    print("# ERRORS")
    print("#" * 80)
    for i, e in enumerate(errors, 1):
        print(f"\n  {i}. {e}")

if warnings:
    print("\n" + "#" * 80)
    print("# WARNINGS")
    print("#" * 80)
    for i, w in enumerate(warnings, 1):
        print(f"\n  {i}. {w}")

results = {
    'errors': errors,
    'warnings': warnings,
    'total_errors': len(errors),
    'total_warnings': len(warnings),
    'key_figures': {
        'total_revenue_2025': reported_total_rev_2025,
        'total_revenue_2024': reported_total_rev_2024,
        'total_expenses_2025': reported_total_exp_2025,
        'total_expenses_2024': reported_total_exp_2024,
        'surplus_2025': reported_surplus_2025,
        'surplus_2024': reported_surplus_2024,
        'total_assets_2025': reported_total_assets_2025,
        'total_assets_2024': reported_total_assets_2024,
        'total_liabilities_2025': reported_total_liab_2025,
        'total_liabilities_2024': reported_total_liab_2024,
        'net_assets_2025': reported_net_assets_2025,
        'net_assets_2024': reported_net_assets_2024,
        'cash_2025': closing_cash_2025,
        'cash_2024': closing_cash_2024,
    }
}

with open('/home/z/my-project/scripts/analysis_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"\nResults saved to /home/z/my-project/scripts/analysis_results.json")