import { apiClient } from './client';
import type { Address } from './addresses';

export interface ShippingZone {
  id: number;
  name: string;
  code: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  min_delivery_days: number;
  max_delivery_days: number;
  shipping_amount?: number;
}

export interface ShippingResolvePayload {
  shipping_zone_id?: number;
  country?: string;
  city?: string;
  region?: string;
  cart_id?: number;
}

export interface ShippingResolveResult {
  shipping_zone: ShippingZone | null;
  shipping_methods: ShippingMethod[];
  cart_id: number | null;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_variant_id: number | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string;
  primary_image_url: string | null;
  primary_image_thumb_url: string | null;
  primary_image_card_url: string | null;
  primary_image_gallery_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency_code: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  shipping_zone_name: string | null;
  shipping_method_name: string | null;
  notes: string | null;
  delivery_notes: string | null;
  placed_at: string;
  items: OrderItem[];
  shipping_address: Partial<Address> | null;
  shipments?: unknown[];
}

export interface CheckoutTotals {
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
}

export interface CheckoutPreviewResult {
  cart: { id: number; currency: string; items: unknown[] };
  address: Address;
  shipping_zone: ShippingZone;
  shipping_method: ShippingMethod;
  totals: CheckoutTotals;
}

export interface PaymentData {
  provider: string;
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface CheckoutInitResult {
  order: Order;
  payment: PaymentData;
}

export interface CheckoutInitPayload {
  address_id: number;
  shipping_method_id: number;
  payment_provider: 'paystack';
  coupon_code?: string;
  notes?: string;
  delivery_notes?: string;
}

export interface GuestCheckoutPayload {
  email: string;
  name: string;
  phone?: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  postal_code?: string;
  shipping_zone_id?: number | null;
  shipping_zone_area_id?: number | null;
  shipping_method_id: number;
  payment_provider: 'paystack';
  notes?: string;
  delivery_notes?: string;
}

export const checkoutApi = {
  resolveShipping(payload: ShippingResolvePayload): Promise<ShippingResolveResult> {
    return apiClient.post<ShippingResolveResult>('/checkout/shipping-methods/resolve', payload);
  },

  preview(address_id: number, shipping_method_id: number): Promise<CheckoutPreviewResult> {
    return apiClient.post<CheckoutPreviewResult>('/checkout/preview', {
      address_id,
      shipping_method_id,
    });
  },

  createOrder(payload: {
    address_id: number;
    shipping_method_id: number;
    notes?: string;
    delivery_notes?: string;
  }): Promise<Order> {
    return apiClient.post<Order>('/checkout/orders', payload);
  },

  initialize(payload: CheckoutInitPayload): Promise<CheckoutInitResult> {
    return apiClient.post<CheckoutInitResult>('/checkout/initialize', payload);
  },

  initializeGuest(payload: GuestCheckoutPayload): Promise<CheckoutInitResult> {
    return apiClient.post<CheckoutInitResult>('/checkout/guest/initialize', payload);
  },
};
