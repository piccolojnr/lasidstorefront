import { apiClient } from './client';
import type { Order } from './checkout';

export interface TimelineEvent {
  status: string;
  label: string;
  occurred_at: string;
}

export const ordersApi = {
  list(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders');
  },

  get(id: number): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  getTimeline(id: number): Promise<TimelineEvent[]> {
    return apiClient.get<TimelineEvent[]>(`/orders/${id}/timeline`);
  },
};
