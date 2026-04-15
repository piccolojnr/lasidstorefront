import { apiClient } from './client';

export interface Address {
  id: number;
  type: 'shipping' | 'billing';
  name: string;
  phone: string | null;
  country: string;
  region: string | null;
  city: string;
  district: string | null;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressPayload = Omit<Address, 'id' | 'created_at' | 'updated_at'>;

export const addressesApi = {
  list(): Promise<Address[]> {
    return apiClient.get<Address[]>('/addresses');
  },

  create(payload: AddressPayload): Promise<Address> {
    return apiClient.post<Address>('/addresses', payload);
  },

  update(id: number, payload: Partial<AddressPayload>): Promise<Address> {
    return apiClient.patch<Address>(`/addresses/${id}`, payload);
  },

  remove(id: number): Promise<null> {
    return apiClient.delete<null>(`/addresses/${id}`);
  },

  setDefault(id: number): Promise<Address> {
    return apiClient.patch<Address>(`/addresses/${id}/default`);
  },
};
