import { useState, useEffect } from 'react';
import { addressesApi, type Address } from '../../api/addresses';
import { ApiError } from '../../api/client';
import AddressForm from '../checkout/address-form';

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    addressesApi.list()
      .then(setAddresses)
      .finally(() => setLoading(false));
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
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === updated.id })),
      );
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
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}

      {addresses.map((addr) =>
        editingId === addr.id ? (
          <div key={addr.id} className="rounded-xl border border-gray-200 p-5">
            <p className="mb-4 text-sm font-semibold text-gray-700">Edit address</p>
            <AddressForm
              initial={addr}
              onSaved={handleSaved}
              onCancel={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div
            key={addr.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 text-sm">
                <p className="font-medium text-gray-900">{addr.name}</p>
                <p className="text-gray-500">{addr.address_line_1}</p>
                {addr.address_line_2 && <p className="text-gray-500">{addr.address_line_2}</p>}
                <p className="text-gray-500">
                  {[addr.district, addr.city, addr.region].filter(Boolean).join(', ')}
                </p>
                {addr.phone && <p className="text-gray-400">{addr.phone}</p>}
                {addr.is_default && (
                  <span className="mt-1 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    Default
                  </span>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(addr.id)}
                  className="text-xs text-gray-400 underline-offset-2 hover:text-gray-700 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="text-xs text-gray-400 underline-offset-2 hover:text-red-500 hover:underline disabled:opacity-40"
                >
                  {deletingId === addr.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>

            {!addr.is_default && (
              <button
                type="button"
                onClick={() => handleSetDefault(addr.id)}
                className="self-start text-xs text-gray-400 underline-offset-2 hover:text-gray-700 hover:underline"
              >
                Set as default
              </button>
            )}
          </div>
        ),
      )}

      {addresses.length === 0 && !showNew && (
        <p className="text-sm text-gray-500">No addresses saved yet.</p>
      )}

      {showNew ? (
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="mb-4 text-sm font-semibold text-gray-700">New address</p>
          <AddressForm onSaved={handleSaved} onCancel={() => setShowNew(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 self-start text-sm font-medium text-gray-700 underline-offset-2 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add address
        </button>
      )}
    </div>
  );
}
