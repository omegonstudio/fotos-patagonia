import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { CartState, CartItem } from "@/lib/types";
import { useAuthStore } from "@/lib/store"; // Importar useAuthStore

interface CartItemBackendPayload {
  photo_id: number;
  quantity: number;
}

interface CartBackendPayload {
  items: CartItemBackendPayload[];
  user_email?: string | null;
  discount_code?: string | null;
}

export function useCart() {
  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuthStore(); // Obtener estado de autenticación

  const getHeaders = useCallback(() => {
    const headers: HeadersInit = {};
    // Si no autenticado y no es una fusión, enviar Guest ID
    if (!isAuthenticated && typeof window !== 'undefined') {
      let guestId = localStorage.getItem('guest_id');
      if (!guestId) {
        guestId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('guest_id', guestId);
      }
      headers['X-Guest-ID'] = guestId;
    }
    return headers;
  }, [isAuthenticated]);

  async function fetchCart() {
    try {
      setLoading(true);
      const result = await apiFetch<CartState>("/cart/", { headers: getHeaders() });
      setCart(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function syncCartWithBackend(frontendCartState: { items: CartItem[], email?: string, discountCode?: string, channel: string }): Promise<CartState> {
    try {
      let result: CartState;
      const { items, email, discountCode } = frontendCartState;

      const basePayload: CartBackendPayload = {
        items: items.map(item => ({
          photo_id: parseInt(item.photoId),
          quantity: 1 // La cantidad siempre es 1 para fotos en este contexto
        })),
        user_email: email || null,
        discount_code: discountCode || null,
      };

      if (cart?.id) {
        // Actualizar carrito existente
        result = await apiFetch<CartState>(`/cart/${cart.id}`, {
          method: "PUT",
          body: JSON.stringify(basePayload),
          headers: getHeaders(),
        });
      } else {
        // Crear nuevo carrito
        result = await apiFetch<CartState>("/cart/", {
          method: "POST",
          body: JSON.stringify(basePayload),
          headers: getHeaders(),
        });
      }
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function addToCart(item: CartItem) {
    try {
      const result = await apiFetch<CartState>("/cart/items", {
        method: "POST",
        body: JSON.stringify(item),
      });
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function removeFromCart(itemId: number) {
    try {
      // OpenAPI usa item_id, no photo_id
      const result = await apiFetch<CartState>(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function updateCartItem(itemId: number, quantity: number) {
    try {
      // OpenAPI usa PUT (no PATCH) y solo acepta { quantity: number }
      const result = await apiFetch<CartState>(`/cart/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function clearCart() {
    try {
      const result = await apiFetch<CartState>("/cart/", {
        method: "DELETE",
      });
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function applyDiscount(discountCode: string) {
    try {
      // OpenAPI: POST /discounts/apply-to-cart
      const result = await apiFetch<CartState>("/discounts/apply-to-cart", {
        method: "POST",
        body: JSON.stringify({ code: discountCode }),
      });
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function removeDiscount() {
    try {
      // OpenAPI: DELETE /discounts/remove-from-cart
      const result = await apiFetch<CartState>("/discounts/remove-from-cart", {
        method: "DELETE",
      });
      setCart(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }
  
  async function getSavedCartByShortId(shortId: string) {
    try {
      // Devuelve directamente el resultado para que el componente lo maneje
      return await apiFetch<any>(`/saved-carts/by-short-id/${shortId}`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

async function createSavedCart(cartId: number) {
    try {
      const result = await apiFetch<any>("/saved-carts", {
        method: "POST",
        body: JSON.stringify({ cart_id: cartId }),
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  useEffect(() => {
    fetchCart();
  }, []);

  return {
    cart,
    loading,
    error,
    refetch: fetchCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    applyDiscount,
    removeDiscount,
    getSavedCartByShortId,
    syncCartWithBackend,
    createSavedCart, 
  };
}
