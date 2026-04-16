import { apiClient } from './client';
import type { PaymentData, Order } from './checkout';

export interface VerifyPaymentResult {
  payment_status: string;
  order: Order;
}

export const paymentsApi = {
  initialize(order_id: number): Promise<PaymentData> {
    return apiClient.post<PaymentData>('/payments/initialize', { order_id });
  },

  verify(reference: string): Promise<VerifyPaymentResult> {
    return apiClient.get<VerifyPaymentResult>(`/payments/verify?reference=${encodeURIComponent(reference)}`);
  },
};
