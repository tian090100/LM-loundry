'use client';

import { useMemo, useState } from 'react';
import { Download, Plus, Wallet } from 'lucide-react';
import { buildFinanceReport, type FinancePeriod } from '@/lib/finance';
import { dateTime, type Expense, type Order } from '@/lib/domain';

type View = 'Transaksi Kas' | 'Pesanan' | 'Piutang';
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format;
const views: View[] = ['Transaksi Kas', 'Pesanan', 'Piutang'];

export default function FinanceView({ orders, expenses, today, loading, onExpense, onOrder }: {
  orders: Order[];
  expenses: Expense[];
  today: string;
  loading: boolean;
  onExpense: () => void;
  onOrder: (id: string) => void;
}) {
  const [preset, setPreset] = useState<'month' | 'today' | 'custom'>('month');
  const monthStart = today.slice(0, 7) + '-01';
  const [custom, setCustom] = useState<FinancePeriod>({ start: monthStart, end: today });
  const [view, setView] = useState<View>('Transaksi Kas');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const start = preset === 'custom' ? custom.start : preset === 'month' ? monthStart : today;
  const end = preset === 'custom' ? custom.end : today;
  const valid = Boolean(start && end && start <= end && end <= today);
  const report = useMemo(
    () => valid ? buildFinanceReport(orders, expenses, { start, end }) : null,
    [orders, expenses, valid, start, end],
  );

  async function download() {
    if (!report || exporting) return;
    setExporting(true);
    setError('');
    try {
      const { createFinanceReport } = await import('@/lib/finance-export');
      const blob = await createFinanceReport(report);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'LM-Laundry-keuangan-' + start + '_sd_' + end + '.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setError('Laporan Excel gagal diunduh. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  }

  const orderRows = report ? view === 'Piutang' ? report.receivables : report.orders : [];
  return <div className="finance-report">
    <section className="card">
      <div className="section-heading">
        <div><h2>Laporan keuangan</h2><p>Periode laporan dalam WIB.</p></div>
        <div className="button-row">
          <button className="secondary" disabled={!report || loading || exporting} onClick={download}><Download size={16}/>{exporting ? 'Menyiapkan Excel…' : 'Unduh Excel'}</button>
          <button className="primary" onClick={onExpense}><Plus size={16}/>Pengeluaran</button>
        </div>
      </div>
      <div className="finance-filters">
        <label>Periode
          <select value={preset} onChange={event => setPreset(event.target.value as typeof preset)}>
            <option value="today">Hari ini</option><option value="month">Bulan ini</option><option value="custom">Rentang tanggal</option>
          </select>
        </label>
        {preset === 'custom' && <>
          <label>Dari<input type="date" value={custom.start} max={today} onChange={event => setCustom({ ...custom, start: event.target.value })}/></label>
          <label>Sampai<input type="date" value={custom.end} max={today} onChange={event => setCustom({ ...custom, end: event.target.value })}/></label>
        </>}
      </div>
      {!valid && <p role="alert">Pilih tanggal awal dan akhir yang berurutan hingga hari ini.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
    {loading && <p role="status">Memuat transaksi…</p>}
    {report && !loading && <>
      <div className="finance-stats">{[
        { label: 'Nilai pesanan', value: report.orderValue, tone: 'blue' },
        { label: 'Kas masuk', value: report.incoming, tone: 'green' },
        { label: 'Kas keluar', value: report.outgoing, tone: 'red' },
        { label: 'Selisih kas', value: report.net, tone: 'blue' },
        { label: 'Piutang akhir periode', value: report.outstanding, tone: 'amber' },
      ].map(stat => <section className="card finance-stat" key={stat.label}>
        <span className={'stat-icon ' + stat.tone}><Wallet size={19}/></span><p>{stat.label}</p><strong>{money(stat.value)}</strong>
      </section>)}</div>
      <section className="card">
        <div className="section-heading"><div><h2>Rincian laporan</h2><p>{start} sampai {end} · {report.orders.length} nota</p></div></div>
        <div className="finance-tabs" aria-label="Rincian laporan">{views.map(option =>
          <button key={option} className={view === option ? 'primary' : 'secondary'} aria-pressed={view === option} onClick={() => setView(option)}>{option}</button>
        )}</div>
        {view === 'Transaksi Kas' ? <>
          <p className="finance-methods">{report.methods.map(row => <span key={row.method}>{row.method} <strong>{money(row.amount)}</strong></span>)}</p>
          {report.transactions.length ? <div className="table-scroll"><table>
            <thead><tr><th>Waktu</th><th>Keterangan</th><th>Metode / kategori</th><th>Kas masuk</th><th>Kas keluar</th></tr></thead>
            <tbody>{report.transactions.map(row => <tr key={row.type + row.id}>
              <td>{dateTime(row.time)}</td><td>{row.reference ? row.reference + ' · ' : ''}{row.note}</td><td>{row.category}</td>
              <td>{row.incoming ? money(row.incoming) : '—'}</td><td>{row.outgoing ? money(row.outgoing) : '—'}</td>
            </tr>)}</tbody>
          </table></div> : <p>Belum ada transaksi kas pada periode ini.</p>}
        </> : <>
          {view === 'Piutang' && <p className="finance-methods">Sisa tagihan hingga {end}, termasuk nota dari periode sebelumnya.</p>}
          {orderRows.length ? <div className="table-scroll"><table>
            <thead><tr><th>Masuk</th><th>No. nota</th><th>Pelanggan</th><th>Tagihan</th><th>Dibayar s.d. akhir periode</th><th>Sisa</th>{view === 'Pesanan' && <><th>Pengerjaan saat ini</th><th>Status bayar akhir periode</th></>}</tr></thead>
            <tbody>{orderRows.map(({ order, paid, remaining }) => <tr key={order.id}>
              <td>{dateTime(order.created)}</td><td><button className="text-btn" onClick={() => onOrder(order.id)}>{order.number}</button></td>
              <td>{order.customer}</td><td>{money(order.total)}</td><td>{money(paid)}</td><td>{money(remaining)}</td>
              {view === 'Pesanan' && <><td>{order.status}</td><td>{remaining === 0 ? 'Lunas' : paid > 0 ? 'Bayar sebagian' : 'Belum bayar'}</td></>}
            </tr>)}</tbody>
          </table></div> : <p>{view === 'Piutang' ? 'Tidak ada piutang pada akhir periode.' : 'Belum ada pesanan pada periode ini.'}</p>}
        </>}
      </section>
    </>}
  </div>;
}
