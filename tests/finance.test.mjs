import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import { createFinanceReport } from '../lib/finance-export.ts';

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './domain' && context.parentURL?.endsWith('/lib/finance.ts')) {
      return nextResolve('./domain.ts', context);
    }
    return nextResolve(specifier, context);
  },
});
const { buildFinanceReport } = await import('../lib/finance.ts');
hooks.deregister();

test('historical cash, carryover receivables and Excel reconcile using laundry samples', async () => {
  const db = new DatabaseSync(':memory:');
  for (const path of ['../drizzle/0000_early_red_hulk.sql', './finance-fixtures.sql']) {
    db.exec(readFileSync(new URL(path, import.meta.url), 'utf8'));
  }
  const orders = db.prepare('SELECT * FROM orders').all().map(order => ({
    ...order,
    payments: db.prepare('SELECT * FROM payments WHERE order_id = ?').all(order.id),
  }));
  const expenses = db.prepare('SELECT * FROM expenses').all();
  db.close();

  const september = buildFinanceReport(orders, expenses, { start: '2026-09-01', end: '2026-09-30' });
  assert.equal(september.incoming, 6000);
  assert.equal(september.outstanding, 16000);

  const october = buildFinanceReport(orders, expenses, { start: '2026-10-01', end: '2026-10-31' });
  assert.deepEqual(
    [october.orders.length, october.orderValue, october.incoming, october.outgoing, october.net, october.outstanding],
    [2, 43702.5, 26000, 75000, -49000, 33702.5],
  );
  assert.equal(october.methods.find(row => row.method === 'Transfer').amount, 16000);

  const november = buildFinanceReport(orders, expenses, { start: '2026-11-01', end: '2026-11-02' });
  assert.equal(november.orders.length, 1);
  assert.equal(november.outstanding, 102402.5);

  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await (await createFinanceReport(october)).arrayBuffer());
  assert.deepEqual(book.worksheets.map(sheet => sheet.name), ['Ringkasan', 'Transaksi Kas', 'Pesanan', 'Piutang']);
  assert.equal(book.getWorksheet('Ringkasan').getCell('B7').value, -49000);
  assert.equal(book.getWorksheet('Transaksi Kas').getCell('A4').value.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(book.getWorksheet('Piutang').getCell('F2').value, 33702.5);
});
