'use client';

import { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { Customer } from '@/lib/domain';

const resultLimit = 8;

export default function CustomerSearch({ customers, onSelect }: {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
}) {
  const [query, setQuery] = useState('');
  const firstResult = useRef<HTMLButtonElement>(null);
  const nameQuery = query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id');
  const phoneQuery = /^[+\d\s().-]+$/.test(nameQuery)
    ? nameQuery.replace(/\D/g, '').replace(/^08/, '628')
    : '';
  const matches = nameQuery ? customers.filter(customer =>
    customer.name.toLocaleLowerCase('id').includes(nameQuery) ||
    (phoneQuery && customer.phone?.includes(phoneQuery)),
  ) : [];

  return <div className="customer-lookup">
    <label htmlFor="existing-customer">Cari pelanggan lama</label>
    <div className="customer-lookup-input">
      <Search size={17} aria-hidden="true"/>
      <input id="existing-customer" type="search" placeholder="Nama atau nomor WhatsApp"
        autoComplete="off" value={query} onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            firstResult.current?.focus();
          }
          if (event.key === 'Escape') setQuery('');
        }}/>
    </div>
    {nameQuery && <>
      <small role="status">{matches.length === 0
        ? 'Pelanggan tidak ditemukan. Isi data pelanggan di bawah untuk pesanan baru.'
        : matches.length > resultLimit
          ? `Menampilkan ${resultLimit} dari ${matches.length} pelanggan. Ketik lebih lengkap untuk mempersempit hasil.`
          : `${matches.length} pelanggan ditemukan.`}</small>
      {matches.length > 0 && <ul className="customer-lookup-results">
        {matches.slice(0, resultLimit).map((customer, index) =>
          <li key={customer.id}><button ref={index === 0 ? firstResult : undefined} type="button"
            onClick={() => { onSelect(customer); setQuery(''); }}>
            <strong>{customer.name}</strong>
            <span>{customer.phone ? '+' + customer.phone : 'Nomor belum tercatat'}</span>
          </button></li>,
        )}
      </ul>}
    </>}
  </div>;
}
