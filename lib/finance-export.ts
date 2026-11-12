import ExcelJS from 'exceljs';
import type { Expense, Order } from './domain';

const rupiah = '"Rp "#,##0;"-Rp "#,##0';
const wibOffset = 7 * 60 * 60 * 1000;

function styleHeader(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF193556' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle' };
  });
}

export async function createFinanceReport(orders: Order[], expenses: Expense[]) {
  const payments = orders.flatMap(order => order.payments.map(payment => ({
    time: payment.created,
    type: 'Pembayaran',
    reference: order.number,
    category: payment.method,
    amount: payment.amount,
  })));
  const transactions = [
    ...payments,
    ...expenses.map(expense => ({
      time: expense.created,
      type: 'Pengeluaran',
      reference: expense.note || 'Biaya operasional',
      category: expense.category,
      amount: -expense.amount,
    })),
  ].sort((a, b) => Date.parse(b.time) - Date.parse(a.time));

  const workbook = new ExcelJS.Workbook();
  const summary = workbook.addWorksheet('Ringkasan');
  summary.columns = [{ width: 28 }, { width: 22, style: { numFmt: rupiah } }];
  const income = payments.reduce((total, payment) => total + payment.amount, 0);
  const spending = expenses.reduce((total, expense) => total + expense.amount, 0);
  summary.addRows([
    ['LM Laundry', 'Laporan keuangan'],
    ['Total pemasukan', income],
    ['Total pengeluaran', spending],
    ['Selisih kas', income - spending],
  ]);
  styleHeader(summary.getRow(1));
  summary.getRow(4).font = { bold: true };

  const detail = workbook.addWorksheet('Transaksi', { views: [{ state: 'frozen', ySplit: 1 }] });
  detail.columns = [
    { header: 'Waktu (WIB)', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Jenis', width: 17 },
    { header: 'Referensi / catatan', width: 32, style: { alignment: { wrapText: true } } },
    { header: 'Metode / kategori', width: 23, style: { alignment: { wrapText: true } } },
    { header: 'Nominal', width: 19, style: { numFmt: rupiah } },
  ];
  for (const transaction of transactions) {
    detail.addRow([
      new Date(Date.parse(transaction.time) + wibOffset),
      transaction.type,
      transaction.reference,
      transaction.category,
      transaction.amount,
    ]);
  }
  styleHeader(detail.getRow(1));
  detail.autoFilter = { from: 'A1', to: `E${detail.rowCount}` };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
