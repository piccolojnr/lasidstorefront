import { useState } from 'react';
import { cartApi } from '../../api/cart';
import type { ProductVariant } from '../../api/catalog';

interface Props {
  productId: number;
  variants: ProductVariant[];
}

export default function AddToCart({ productId, variants }: Props) {
  const activeVariants = variants.filter((v) => v.is_active);
  const hasVariants = activeVariants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    hasVariants ? activeVariants[0]!.id : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleAddToCart() {
    setStatus('loading');
    setErrorMsg('');

    try {
      await cartApi.addItem({
        product_id: productId,
        ...(selectedVariantId ? { product_variant_id: selectedVariantId } : {}),
        quantity,
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not add item. Please try again.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Variant selector */}
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Option</label>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={[
                  'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                  selectedVariantId === v.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400',
                ].join(' ')}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + add row */}
      <div className="flex items-center gap-3">
        {/* Quantity stepper */}
        <div className="flex items-center rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50"
            aria-label="Increase quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Add to cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={status === 'loading'}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60',
            status === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-700',
          ].join(' ')}
        >
          {status === 'loading' && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {status === 'success' ? 'Added to cart!' : 'Add to cart'}
        </button>
      </div>

      {/* Error */}
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
