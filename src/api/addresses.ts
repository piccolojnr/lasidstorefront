import { apiClient } from './client';

export interface ShippingZoneArea {
  id: number;
  area_type: string;
  area_name: string;
}

export interface ShippingZoneSummary {
  id: number;
  name: string;
  code: string;
  areas: ShippingZoneArea[];
}

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
  shipping_zone_id: number | null;
  shipping_zone_area_id: number | null;
  shipping_zone: { id: number; name: string; code: string } | null;
  shipping_zone_area: { id: number; area_type: string; area_name: string } | null;
  created_at: string;
  updated_at: string;
}

export type AddressPayload = Omit<
  Address,
  'id' | 'created_at' | 'updated_at' | 'shipping_zone' | 'shipping_zone_area'
>;

export const addressesApi = {
  list(): Promise<Address[]> {
    return apiClient.get<Address[]>('/addresses');
  },

  listZones(): Promise<ShippingZoneSummary[]> {
    return apiClient.get<ShippingZoneSummary[]>('/shipping-zones');
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
