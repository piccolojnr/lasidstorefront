import { apiClient } from './client';

export interface StorefrontAnnouncement {
  enabled: boolean;
  message: string;
  cta: {
    label: string;
    url: string;
  } | null;
  variant: 'default' | 'success' | 'sale' | 'warning';
  starts_at: string | null;
  ends_at: string | null;
}

export const storefrontApi = {
  getAnnouncement(): Promise<StorefrontAnnouncement> {
    return apiClient.get<StorefrontAnnouncement>('/storefront/announcement');
  },
};
