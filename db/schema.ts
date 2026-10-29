import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
 id: text('id').primaryKey(), number: text('number').notNull().unique(),
 customer: text('customer').notNull(), phone: text('phone').notNull(),
 items: text('items').notNull(), total: integer('total').notNull(),
 discount: integer('discount').notNull(), extra: integer('extra').notNull(),
 status: text('status').notNull(), due: text('due').notNull(),
 created: text('created').notNull(), notes: text('notes').notNull(),
 packages: integer('packages').notNull(), rack: text('rack').notNull(),
 history: text('history').notNull(),
});
export const payments = sqliteTable('payments', {
 id: text('id').primaryKey(), orderId: text('order_id').notNull().references(()=>orders.id),
 amount: integer('amount').notNull(), method: text('method').notNull(),
 created: text('created').notNull(), actor: text('actor').notNull(),
});
export const expenses = sqliteTable('expenses', {
 id: text('id').primaryKey(), category: text('category').notNull(),
 amount: integer('amount').notNull(), note: text('note').notNull(),
 created: text('created').notNull(), actor: text('actor').notNull(),
});
