-- Data latihan lokal. Nominal nota dan biaya diambil dari workbook.
-- Nama, metode, dan waktu pembayaran adalah skenario uji.
INSERT OR IGNORE INTO orders
  (id, number, customer, phone, items, total, discount, extra, status, due, created, notes, packages, rack, history)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'UJI-202609-001', 'Pelanggan Uji A', '',
   '[{"serviceId":"bed","name":"Selimut + Sprei","unit":"pcs","quantity":1,"price":22000,"subtotal":22000}]',
   22000, 0, 0, 'Selesai', '2026-09-06T03:00:00.000Z', '2026-09-03T03:00:00.000Z', 'Data latihan', 1, '', '[]'),
  ('10000000-0000-4000-8000-000000000002', 'UJI-202610-004', 'Pelanggan Uji B', '',
   '[{"serviceId":"wash-2d","name":"Cuci + Setrika Wangi","unit":"kg","quantity":1.34,"price":7500,"subtotal":10000}]',
   10000, 0, 0, 'Selesai', '2026-10-03T03:00:00.000Z', '2026-10-01T03:00:00.000Z', 'Data latihan', 1, '', '[]'),
  ('10000000-0000-4000-8000-000000000003', 'UJI-202610-168', 'Pelanggan Uji C', '',
   '[{"serviceId":"wash","name":"Cuci + Setrika Wangi","unit":"kg","quantity":5.185,"price":6500,"subtotal":33702.5}]',
   33702.5, 0, 0, 'Siap Diambil', '2026-11-02T03:00:00.000Z', '2026-10-30T03:00:00.000Z', 'Data latihan', 1, '', '[]'),
  ('10000000-0000-4000-8000-000000000004', 'UJI-202611-002', 'Pelanggan Uji D', '',
   '[{"serviceId":"wash-2d","name":"Cuci + Setrika Wangi","unit":"kg","quantity":9.16,"price":7500,"subtotal":68700}]',
   68700, 0, 0, 'Diterima', '2026-11-03T03:00:00.000Z', '2026-11-01T03:00:00.000Z', 'Data latihan', 1, '', '[]');

INSERT OR IGNORE INTO payments (id, order_id, amount, method, created, actor) VALUES
  ('uji-bayar-1', '10000000-0000-4000-8000-000000000001', 6000, 'Tunai', '2026-09-30T16:59:59.999Z', 'Latihan'),
  ('uji-bayar-2', '10000000-0000-4000-8000-000000000001', 16000, 'Transfer', '2026-09-30T17:00:00.000Z', 'Latihan'),
  ('uji-bayar-3', '10000000-0000-4000-8000-000000000002', 10000, 'QRIS', '2026-10-01T03:15:00.000Z', 'Latihan');

INSERT OR IGNORE INTO expenses (id, category, amount, note, created, actor) VALUES
  ('uji-biaya-1', 'Operasional', 75000, 'Isi ulang gas (data latihan)', '2026-10-01T04:00:00.000Z', 'Latihan');
