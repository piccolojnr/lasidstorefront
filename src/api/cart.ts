import { apiClient } from './client';
import { cartToken, cartStore, type Cart } from '../stores/cart-store';

export interface AddItemPayload {
  product_id: number;
  product_variant_id?: number;
  quantity: number;
}

export interface UpdateItemPayload {
  quantity: number;
}

function syncToken(cart: Cart): Cart {
  if (cart.cart_token && cart.cart_token !== cartToken.get()) {
    cartToken.set(cart.cart_token);
  }
  cartStore.set(cart);
  return cart;
}

export const cartApi = {
  getCart(): Promise<Cart> {
    return apiClient.get<Cart>('/cart').then(syncToken);
  },

  addItem(payload: AddItemPayload): Promise<Cart> {
    return apiClient.post<Cart>('/cart/items', payload).then(syncToken);
  },

  updateItem(cartItemId: number, payload: UpdateItemPayload): Promise<Cart> {
    return apiClient.patch<Cart>(`/cart/items/${cartItemId}`, payload).then(syncToken);
  },

  removeItem(cartItemId: number): Promise<Cart> {
    return apiClient.delete<Cart>(`/cart/items/${cartItemId}`).then(syncToken);
  },
};
