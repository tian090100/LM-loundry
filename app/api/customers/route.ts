import { env } from 'cloudflare:workers';
import { authJSON, getSession, sameOrigin } from '@/lib/auth';
import type { Customer } from '@/lib/domain';

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return authJSON({ error: 'Silakan masuk terlebih dahulu.' }, 401);
  if (user.role !== 'owner' || !sameOrigin(request)) {
    return authJSON({ error: 'Impor pelanggan hanya tersedia untuk Owner.' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJSON({ error: 'Berkas pelanggan tidak valid.' }, 400);
  }
  if (!Array.isArray(body) || !body.length || body.length > 250) {
    return authJSON({ error: 'Kirim 1–250 pelanggan per impor.' }, 400);
  }

  const customers: Customer[] = [];
  for (const row of body) {
    const name = typeof row?.name === 'string' ? row.name.trim().replace(/\s+/g, ' ') : '';
    const phone = row?.phone;
    if (!name || name.length > 100 || (phone !== null && (typeof phone !== 'string' || !/^62\d{8,13}$/.test(phone)))) {
      return authJSON({ error: 'Ada nama atau nomor pelanggan yang tidak valid.' }, 400);
    }
    customers.push({ id: phone ?? 'name:' + name.toLowerCase(), name, phone });
  }

  try {
    const result = await env.DB!.prepare(
      "INSERT INTO customers (id, name, phone) SELECT value->>'id', value->>'name', value->>'phone' FROM json_each(?) WHERE true ON CONFLICT DO NOTHING",
    ).bind(JSON.stringify(customers)).run();
    return authJSON({ received: customers.length, inserted: result.meta.changes });
  } catch (error) {
    console.error('Customer import failed', error);
    return authJSON({ error: 'Impor pelanggan gagal. Silakan coba lagi.' }, 500);
  }
}
