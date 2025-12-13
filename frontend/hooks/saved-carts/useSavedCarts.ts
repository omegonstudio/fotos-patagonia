"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useSavedCarts(cartId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSavedCarts() {
    try {
      setLoading(true);

      const url = cartId ? `/saved-carts/${cartId}` : `/saved-carts/`;
      const result = await apiFetch(url);

      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveCart(cartData: any) {
    try {
      return await apiFetch('/saved-carts/', {
        method: 'POST',
        body: JSON.stringify(cartData)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  /**
   * Elimina un carrito guardado - OpenAPI: DELETE /saved-carts/{saved_cart_id}
   */
  async function deleteSavedCart(id: string) {
    try {
      return await apiFetch(`/saved-carts/${id}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  /**
   * Envía email de recuperación del carrito
   * OpenAPI: POST /saved-carts/{cart_id}/send-recovery-email
   */
  async function sendRecoveryEmail(id: string) {
    try {
      return await apiFetch(`/saved-carts/${id}/send-recovery-email`, {
        method: 'POST'
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  // NOTA: Los siguientes endpoints NO existen en el OpenAPI actual:
  // - POST /saved-carts/{id}/load (debe implementarse si se necesita)
  // - PUT /saved-carts/{id} (no hay actualización de carritos guardados)
  // - GET /saved-carts/by-email/{email} (usa la lista general y filtra)

  useEffect(() => {
    fetchSavedCarts();
  }, [cartId]);

  return {
    data,
    loading,
    error,
    refetch: fetchSavedCarts,
    saveCart,
    deleteSavedCart,
    sendRecoveryEmail
  };
}

