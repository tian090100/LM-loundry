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
export const appUsers = sqliteTable('app_users', {
 id:text('id').primaryKey(), email:text('email').notNull().unique(), name:text('name').notNull(),
 role:text('role').notNull(), passwordHash:text('password_hash').notNull(), salt:text('salt').notNull(),
 iterations:integer('iterations').notNull(), active:integer('active').notNull(), created:text('created').notNull(),
});
export const appSessions=sqliteTable('app_sessions',{
 tokenHash:text('token_hash').primaryKey(), userId:text('user_id').notNull().references(()=>appUsers.id),
 expires:integer('expires').notNull(), created:integer('created').notNull(),
});
export const authAttempts=sqliteTable('auth_attempts',{
 key:text('key').primaryKey(), attempts:integer('attempts').notNull(), resetAt:integer('reset_at').notNull(),
});
export const customers = sqliteTable('customers', {
 id: text('id').primaryKey(),
 name: text('name').notNull(),
 phone: text('phone').unique(),
});
