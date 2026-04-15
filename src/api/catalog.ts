import { apiClient } from './client';

export interface Category {
  id: number;
  name: string;
  slug: string;
  children: Category[];
  image_url?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
}

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  is_active: boolean;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  primary_image_url: string | null;
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  brand: Pick<Brand, 'id' | 'name' | 'slug'> | null;
}

export interface ProductDetail extends ProductSummary {
  product_type: string;
  short_description: string | null;
  description: string | null;
  track_inventory: boolean;
  allow_backorders: boolean;
  published_at: string;
  images: ProductImage[];
  category: (Pick<Category, 'id' | 'name' | 'slug'> & { image_url?: string }) | null;
  brand: (Pick<Brand, 'id' | 'name' | 'slug'> & { image_url?: string }) | null;
  variants: ProductVariant[];
  related_products: ProductSummary[];
}

export interface ProductsQuery {
  search?: string;
  category?: string;
  brand?: string;
  featured?: boolean | 1 | 0;
  sort?: 'latest' | 'price_asc' | 'price_desc';
  page?: number;
}

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const catalogApi = {
  getCategories(params: { root_only?: boolean } = {}): Promise<Category[]> {
    const qs = params.root_only ? '?root_only=1' : '';
    return apiClient.get<Category[]>(`/catalog/categories${qs}`);
  },

  getCategory(slug: string): Promise<Category> {
    return apiClient.get<Category>(`/catalog/categories/${slug}`);
  },

  getProducts(query: ProductsQuery = {}): Promise<{ data: ProductSummary[]; meta: unknown }> {
    const qs = buildQuery(query as Record<string, unknown>);
    // Products endpoint returns paginated envelope — return raw for meta access
    return fetch(`${import.meta.env.PUBLIC_API_BASE ?? '/api/v1'}/catalog/products${qs}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then((r) => r.json());
  },

  getProduct(slug: string): Promise<ProductDetail> {
    return apiClient.get<ProductDetail>(`/catalog/products/${slug}`);
  },
};
