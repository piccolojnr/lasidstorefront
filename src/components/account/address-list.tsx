import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { addressesApi, type Address } from '@/api/addresses';
import { ApiError } from '@/api/client';
import AddressForm from '@/components/checkout/address-form';

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    addressesApi.list().then(setAddresses).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError('');
    try {
      await addressesApi.remove(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete address.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: number) {
    setError('');
    try {
      const updated = await addressesApi.setDefault(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === updated.id })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update address.');
    }
  }

  function handleSaved(address: Address) {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === address.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = address;
        return next;
      }
      return [address, ...prev];
    });
    setEditingId(null);
    setShowNew(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-muted h-28 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{error}</p>
      )}

      {addresses.map((addr) =>
        editingId === addr.id ? (
          <div key={addr.id} className="border-border rounded-xl border p-5">
            <p className="text-foreground mb-4 text-sm font-semibold">Edit address</p>
            <AddressForm initial={addr} onSaved={handleSaved} onCancel={() => setEditingId(null)} />
          </div>
        ) : (
          <div key={addr.id} className="border-border flex flex-col gap-3 rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 text-sm">
                <p className="text-foreground font-medium">{addr.name}</p>
                <p className="text-muted-foreground">{addr.address_line_1}</p>
                {addr.address_line_2 && <p className="text-muted-foreground">{addr.address_line_2}</p>}
                <p className="text-muted-foreground">
                  {[addr.district, addr.city, addr.region].filter(Boolean).join(', ')}
                </p>
                {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                {addr.is_default && (
                  <span className="bg-muted text-muted-foreground mt-1 w-fit rounded-full px-2 py-0.5 text-xs">Default</span>
                )}
                {!addr.shipping_zone_id && (
                  <span className="mt-1 w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    No shipping zone — update before checkout
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(addr.id)}>Edit</Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {deletingId === addr.id ? '…' : 'Delete'}
                </Button>
              </div>
            </div>
            {!addr.is_default && (
              <Button variant="ghost" size="xs" className="self-start" onClick={() => handleSetDefault(addr.id)}>
                Set as default
              </Button>
            )}
          </div>
        ),
      )}

      {addresses.length === 0 && !showNew && (
        <p className="text-muted-foreground text-sm">No addresses saved yet.</p>
      )}

      {showNew ? (
        <div className="border-border rounded-xl border p-5">
          <p className="text-foreground mb-4 text-sm font-semibold">New address</p>
          <AddressForm onSaved={handleSaved} onCancel={() => setShowNew(false)} />
        </div>
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setShowNew(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add address
        </Button>
      )}
    </div>
  );
}
