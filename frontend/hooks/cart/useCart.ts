"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { CartState, CartItem } from "@/lib/types";

export function useCart() {
  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCart() {
    try {
      setLoading(true);
      const result = await apiFetch<CartState>("/cart/");
      setCart(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
  };
}
