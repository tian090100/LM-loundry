import ExcelJS from 'exceljs';
import type { FinanceReport } from './finance';

const rupiah = '"Rp "#,##0.##;"-Rp "#,##0.##';
const timestamp = 'dd/mm/yyyy hh:mm';
const wib = (iso: string) => new Date(Date.parse(iso) + 7 * 60 * 60 * 1000);

function styleHeader(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF193556' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle' };
  });
}

function addTable(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Partial<ExcelJS.Column>[],
  rows: (string | number | Date)[][],
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns;
  sheet.addRows(rows);
  styleHeader(sheet.getRow(1));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: columns.length } };
}

export async function createFinanceReport(report: FinanceReport) {
  const workbook = new ExcelJS.Workbook();
  const summary = workbook.addWorksheet('Ringkasan');
  summary.columns = [{ width: 30 }, { width: 30, style: { numFmt: rupiah } }];
  summary.addRows([
    ['LM Laundry', 'Laporan keuangan'],
    ['Periode (WIB)', report.period.start + ' s.d. ' + report.period.end],
    ['Jumlah nota', report.orders.length],
    ['Nilai pesanan', report.orderValue],
    ['Kas masuk', report.incoming],
    ['Kas keluar', report.outgoing],
    ['Selisih kas', report.net],
    ['Piutang akhir periode', report.outstanding],
    [],
    ['Metode pembayaran', 'Kas masuk'],
    ...report.methods.map(({ method, amount }) => [method, amount]),
  ]);
  summary.getCell('B3').numFmt = '0';
  styleHeader(summary.getRow(1));
  styleHeader(summary.getRow(10));

  const date = { width: 22, style: { numFmt: timestamp } };
  const amount = { width: 19, style: { numFmt: rupiah } };
  const number = { header: 'No. nota', width: 29 };
  const customer = { header: 'Pelanggan', width: 28 };
  const balances = [
    { header: 'Tagihan', ...amount },
    { header: 'Dibayar s.d. akhir periode', ...amount, width: 28 },
    { header: 'Sisa tagihan', ...amount },
  ];
  addTable(workbook, 'Transaksi Kas', [
    { header: 'Waktu (WIB)', ...date }, { header: 'Jenis', width: 17 },
    { header: 'Referensi', width: 29 }, { header: 'Keterangan', width: 32 },
    { header: 'Metode / kategori', width: 24 },
    { header: 'Kas masuk', ...amount }, { header: 'Kas keluar', ...amount },
  ], report.transactions.map(row => [
    wib(row.time), row.type, row.reference, row.note, row.category, row.incoming, row.outgoing,
  ]));
  addTable(workbook, 'Pesanan', [
    { header: 'Masuk (WIB)', ...date }, number, customer, ...balances,
    { header: 'Status pengerjaan saat ini', width: 28 },
    { header: 'Status bayar akhir periode', width: 28 },
  ], report.orders.map(({ order, paid, remaining }) => [
    wib(order.created), order.number, order.customer, order.total, paid, remaining,
    order.status, remaining === 0 ? 'Lunas' : paid > 0 ? 'Bayar sebagian' : 'Belum bayar',
  ]));
  addTable(workbook, 'Piutang', [
    { header: 'Masuk (WIB)', ...date }, number, customer, ...balances,
  ], report.receivables.map(({ order, paid, remaining }) => [
    wib(order.created), order.number, order.customer, order.total, paid, remaining,
  ]));

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
