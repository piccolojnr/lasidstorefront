import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cartApi } from '@/api/cart';
import type { ProductVariant } from '@/api/catalog';

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
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not add item. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Variant selector */}
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Option</p>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map((v) => (
              <Button
                key={v.id}
                type="button"
                variant={selectedVariantId === v.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVariantId(v.id)}
              >
                {v.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + add row */}
      <div className="flex items-center gap-3">
        {/* Quantity stepper */}
        <div className="border-border flex items-center rounded-lg border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </Button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Button>
        </div>

        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={status === 'loading'}
          size="lg"
          className={['flex-1 transition-colors', status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''].join(' ')}
        >
          {status === 'loading' && (
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {status === 'success' ? 'Added to cart!' : 'Add to cart'}
        </Button>
      </div>

      {status === 'error' && <p className="text-destructive text-sm">{errorMsg}</p>}
    </div>
  );
}
