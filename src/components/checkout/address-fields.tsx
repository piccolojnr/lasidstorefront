import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type ShippingZoneSummary } from '@/api/addresses';
import { cn } from '@/lib/utils';

export type AddressFieldsValue = {
  name: string;
  phone: string;
  email?: string;
  country: string;
  region: string;
  city: string;
  district: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  postal_code: string;
  shipping_zone_id: number | null;
  shipping_zone_area_id: number | null;
  is_default?: boolean;
};

interface AddressFieldsProps {
  form: AddressFieldsValue;
  fieldErrors: Record<string, string[]>;
  zones: ShippingZoneSummary[];
  showEmail?: boolean;
  showDefaultToggle?: boolean;
  disabled?: boolean;
  onFieldChange: <K extends keyof AddressFieldsValue>(
    key: K,
    value: AddressFieldsValue[K],
  ) => void;
}

function FieldShell({
  id,
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function AddressFields({
  form,
  fieldErrors,
  zones,
  showEmail = false,
  showDefaultToggle = false,
  disabled = false,
  onFieldChange,
}: AddressFieldsProps) {
  const selectedZone = zones.find((zone) => zone.id === form.shipping_zone_id) ?? null;
  const areaOptions = selectedZone?.areas ?? [];
  const countryLabel = form.country === 'GH' ? 'Ghana (GH)' : form.country;

  return (
    <div className="flex flex-col gap-6">
      <FormSection
        title="Contact details"
        description="Use the contact details we should use for delivery updates and order questions."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            id="name"
            label="Full name"
            required
            error={fieldErrors.name?.[0]}
          >
            <Input
              id="name"
              value={form.name}
              onChange={(event) => onFieldChange('name', event.target.value)}
              aria-invalid={!!fieldErrors.name?.[0]}
              disabled={disabled}
              autoComplete="name"
            />
          </FieldShell>

          <FieldShell
            id="phone"
            label="Phone"
            error={fieldErrors.phone?.[0]}
            hint="Optional, but useful for delivery coordination."
          >
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => onFieldChange('phone', event.target.value)}
              aria-invalid={!!fieldErrors.phone?.[0]}
              disabled={disabled}
              autoComplete="tel"
            />
          </FieldShell>
        </div>

        {showEmail && (
          <FieldShell
            id="email"
            label="Email"
            required
            error={fieldErrors.email?.[0]}
          >
            <Input
              id="email"
              type="email"
              value={form.email ?? ''}
              onChange={(event) => onFieldChange('email', event.target.value)}
              aria-invalid={!!fieldErrors.email?.[0]}
              disabled={disabled}
              autoComplete="email"
            />
          </FieldShell>
        )}
      </FormSection>

      <FormSection
        title="Delivery zone"
        description="Choose the delivery zone first so the storefront can resolve valid shipping methods."
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <FieldShell
            id="shipping_zone_id"
            label="Shipping zone"
            required
            error={fieldErrors.shipping_zone_id?.[0]}
          >
            <Select
              id="shipping_zone_id"
              value={form.shipping_zone_id ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value ? Number(event.target.value) : null;
                onFieldChange('shipping_zone_id', nextValue);
                onFieldChange('shipping_zone_area_id', null);
              }}
              aria-invalid={!!fieldErrors.shipping_zone_id?.[0]}
              disabled={disabled}
            >
              <option value="">Select a delivery zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
          </FieldShell>

          <FieldShell
            id="shipping_zone_area_id"
            label="Area"
            error={fieldErrors.shipping_zone_area_id?.[0]}
            hint={
              selectedZone && areaOptions.length === 0
                ? 'No area selection is required for this zone.'
                : 'Optional when your delivery zone has area breakdowns.'
            }
          >
            <Select
              id="shipping_zone_area_id"
              value={form.shipping_zone_area_id ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value ? Number(event.target.value) : null;
                onFieldChange('shipping_zone_area_id', nextValue);
              }}
              aria-invalid={!!fieldErrors.shipping_zone_area_id?.[0]}
              disabled={disabled || !selectedZone || areaOptions.length === 0}
            >
              <option value="">
                {selectedZone ? 'Select an area' : 'Select a zone first'}
              </option>
              {areaOptions.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.area_name}
                  {area.area_type !== 'country' ? ` (${area.area_type})` : ''}
                </option>
              ))}
            </Select>
          </FieldShell>
        </div>
      </FormSection>

      <FormSection
        title="Delivery address"
        description="Use the street address where the package should be handed off."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            id="country"
            label="Country"
            required
            error={fieldErrors.country?.[0]}
          >
            <Input
              id="country"
              value={countryLabel}
              readOnly
              disabled
            />
          </FieldShell>

          <FieldShell
            id="region"
            label="Region / State"
            error={fieldErrors.region?.[0]}
          >
            <Input
              id="region"
              value={form.region}
              onChange={(event) => onFieldChange('region', event.target.value)}
              aria-invalid={!!fieldErrors.region?.[0]}
              disabled={disabled}
              autoComplete="address-level1"
            />
          </FieldShell>
        </div>

        <FieldShell
          id="address_line_1"
          label="Address line 1"
          required
          error={fieldErrors.address_line_1?.[0]}
        >
          <Input
            id="address_line_1"
            value={form.address_line_1}
            onChange={(event) => onFieldChange('address_line_1', event.target.value)}
            aria-invalid={!!fieldErrors.address_line_1?.[0]}
            disabled={disabled}
            autoComplete="address-line1"
          />
        </FieldShell>

        <FieldShell
          id="address_line_2"
          label="Address line 2"
          error={fieldErrors.address_line_2?.[0]}
          hint="Apartment, suite, floor, or other secondary location details."
        >
          <Input
            id="address_line_2"
            value={form.address_line_2}
            onChange={(event) => onFieldChange('address_line_2', event.target.value)}
            aria-invalid={!!fieldErrors.address_line_2?.[0]}
            disabled={disabled}
            autoComplete="address-line2"
          />
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldShell
            id="city"
            label="City"
            required
            error={fieldErrors.city?.[0]}
          >
            <Input
              id="city"
              value={form.city}
              onChange={(event) => onFieldChange('city', event.target.value)}
              aria-invalid={!!fieldErrors.city?.[0]}
              disabled={disabled}
              autoComplete="address-level2"
            />
          </FieldShell>

          <FieldShell
            id="district"
            label="District"
            error={fieldErrors.district?.[0]}
          >
            <Input
              id="district"
              value={form.district}
              onChange={(event) => onFieldChange('district', event.target.value)}
              aria-invalid={!!fieldErrors.district?.[0]}
              disabled={disabled}
            />
          </FieldShell>

          <FieldShell
            id="postal_code"
            label="Postal code"
            error={fieldErrors.postal_code?.[0]}
            hint="Optional if your location does not use postal codes."
          >
            <Input
              id="postal_code"
              value={form.postal_code}
              onChange={(event) => onFieldChange('postal_code', event.target.value)}
              aria-invalid={!!fieldErrors.postal_code?.[0]}
              disabled={disabled}
              autoComplete="postal-code"
            />
          </FieldShell>
        </div>

        <FieldShell
          id="landmark"
          label="Landmark / delivery note"
          error={fieldErrors.landmark?.[0]}
          hint="Useful details like a nearby store, reception desk, or gate instructions."
        >
          <Textarea
            id="landmark"
            value={form.landmark}
            onChange={(event) => onFieldChange('landmark', event.target.value)}
            aria-invalid={!!fieldErrors.landmark?.[0]}
            disabled={disabled}
            rows={3}
          />
        </FieldShell>
      </FormSection>

      {showDefaultToggle && (
        <label className="flex items-start gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 text-sm">
          <input
            type="checkbox"
            checked={!!form.is_default}
            onChange={(event) => onFieldChange('is_default', event.target.checked)}
            className="border-input mt-0.5 rounded"
            disabled={disabled}
          />
          <span className="flex flex-col gap-1">
            <span className="text-foreground font-medium">Set as default address</span>
            <span className="text-muted-foreground">
              This address will be preselected the next time you check out.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
