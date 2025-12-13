"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Hook para manejar el proceso de checkout
 * Endpoints basados en OpenAPI spec
 */
export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crea una orden - OpenAPI: POST /checkout/create-order
   */
  async function createOrder(orderData: any) {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFetch('/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Crea preferencia de MercadoPago - OpenAPI: POST /checkout/mercadopago/create-preference
   */
  async function createMercadoPagoPreference(orderData: any) {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFetch('/checkout/mercadopago/create-preference', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Registra una venta local - OpenAPI: POST /checkout/local
   */
  async function registerLocalSale(saleData: any) {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFetch('/checkout/local', {
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Obtiene el estado del checkout - OpenAPI: GET /checkout/status
   */
  async function getCheckoutStatus(params?: Record<string, string>) {
    try {
      setLoading(true);
      setError(null);

      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const result = await apiFetch(`/checkout/status${queryString}`);

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    createOrder,
    createMercadoPagoPreference,
    registerLocalSale,
    getCheckoutStatus
  };
}

