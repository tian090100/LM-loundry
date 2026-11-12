import { METHODS, type Expense, type Order } from './domain';

export type FinancePeriod = { start: string; end: string };

export function buildFinanceReport(orders: Order[], expenses: Expense[], period: FinancePeriod) {
  const start = Date.parse(period.start + 'T00:00:00+07:00');
  const end = Date.parse(period.end + 'T00:00:00+07:00') + 86_400_000;
  const inPeriod = (time: string) => {
    const timestamp = Date.parse(time);
    return timestamp >= start && timestamp < end;
  };
  const beforeEnd = (time: string) => Date.parse(time) < end;
  const orderRows = orders.filter(order => beforeEnd(order.created)).map(order => {
    const paid = order.payments.filter(payment => beforeEnd(payment.created))
      .reduce((sum, payment) => sum + payment.amount, 0);
    return { order, paid, remaining: Math.max(0, order.total - paid) };
  });
  const periodOrders = orderRows.filter(({ order }) => inPeriod(order.created));
  const receivables = orderRows.filter(row => row.remaining > 0)
    .sort((a, b) => Date.parse(a.order.created) - Date.parse(b.order.created));
  const payments = orders.flatMap(order => order.payments.filter(payment => inPeriod(payment.created))
    .map(payment => ({
      id: payment.id, time: payment.created, type: 'Pembayaran',
      reference: order.number, note: order.customer, category: payment.method,
      incoming: payment.amount, outgoing: 0,
    })));
  const spending = expenses.filter(expense => inPeriod(expense.created)).map(expense => ({
    id: expense.id, time: expense.created, type: 'Pengeluaran',
    reference: '', note: expense.note || 'Biaya operasional', category: expense.category,
    incoming: 0, outgoing: expense.amount,
  }));
  const incoming = payments.reduce((sum, row) => sum + row.incoming, 0);
  const outgoing = spending.reduce((sum, row) => sum + row.outgoing, 0);

  return {
    period,
    orders: periodOrders,
    receivables,
    transactions: [...payments, ...spending].sort((a, b) => Date.parse(b.time) - Date.parse(a.time)),
    orderValue: periodOrders.reduce((sum, row) => sum + row.order.total, 0),
    incoming,
    outgoing,
    net: incoming - outgoing,
    outstanding: receivables.reduce((sum, row) => sum + row.remaining, 0),
    methods: [...new Set([...METHODS, ...payments.map(row => row.category)])].map(method => ({
      method, amount: payments.filter(row => row.category === method).reduce((sum, row) => sum + row.incoming, 0),
    })),
  };
}

export type FinanceReport = ReturnType<typeof buildFinanceReport>;
