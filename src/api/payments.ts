import { apiClient } from './client';
import type { PaymentData } from './checkout';

export const paymentsApi = {
  initialize(order_id: number): Promise<PaymentData> {
    return apiClient.post<PaymentData>('/payments/initialize', { order_id });
  },
};
