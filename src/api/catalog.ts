import { apiClient, type PaginatedResult, type PaginationMeta } from './client';

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

export interface Badge {
  key: 'new_arrival' | 'on_sale' | string;
  label: string;
}

export interface TagSummary {
  id: number;
  name: string;
  slug: string;
  description?: string;
  products_count: number;
}

export interface TagDetail {
  tag: TagSummary;
  products: ProductSummary[];
  products_meta: PaginationMeta;
}

export interface CollectionSummary {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  products_count: number;
}

export interface CollectionDetail {
  collection: CollectionSummary;
  products: ProductSummary[];
  products_meta: PaginationMeta;
}

export interface ProductImage {
  id: number;
  url: string;
  thumb_url: string;
  card_url: string;
  gallery_url: string;
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

export interface ProductStock {
  quantity: number;
  status: string;
  is_backorderable: boolean;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  compare_at_price: number | null;
  is_on_sale?: boolean;
  discount_amount?: number | null;
  discount_percentage?: number | null;
  is_featured: boolean;
  badges: Badge[];
  primary_image_url: string | null;
  primary_image_thumb_url: string | null;
  primary_image_card_url: string | null;
  primary_image_gallery_url: string | null;
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  brand: Pick<Brand, 'id' | 'name' | 'slug'> | null;
  stock?: ProductStock | null;
  tags: TagSummary[];
  collections: CollectionSummary[];
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
  tag?: string;
  collection?: string;
  featured?: boolean | 1 | 0;
  on_sale?: boolean | 1 | 0;
  sort?: 'latest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'popular';
  popularity_period?: '7d' | '30d' | '365d' | 'all';
  page?: number;
  min_price?: number;
  max_price?: number;
}

export interface BrandSummary {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  products_count?: number;
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

  getProducts(query: ProductsQuery = {}): Promise<PaginatedResult<ProductSummary>> {
    const qs = buildQuery(query as Record<string, unknown>);
    return apiClient.paginated<ProductSummary>(`/catalog/products${qs}`);
  },

  getProduct(slug: string): Promise<ProductDetail> {
    return apiClient.get<ProductDetail>(`/catalog/products/${slug}`);
  },

  getBrands(): Promise<BrandSummary[]> {
    return apiClient.get<BrandSummary[]>('/catalog/brands');
  },

  getTags(): Promise<TagSummary[]> {
    return apiClient.get<TagSummary[]>('/catalog/tags');
  },

  getTag(slug: string, page?: number): Promise<TagDetail> {
    const qs = page && page > 1 ? `?page=${page}` : '';
    return apiClient.get<TagDetail>(`/catalog/tags/${slug}${qs}`);
  },

  getCollections(): Promise<CollectionSummary[]> {
    return apiClient.get<CollectionSummary[]>('/catalog/collections');
  },

  getCollection(slug: string, page?: number): Promise<CollectionDetail> {
    const qs = page && page > 1 ? `?page=${page}` : '';
    return apiClient.get<CollectionDetail>(`/catalog/collections/${slug}${qs}`);
  },
};
