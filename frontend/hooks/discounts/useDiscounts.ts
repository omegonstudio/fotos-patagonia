"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendDiscount {
  id: number;
  code: string;
  percentage: number;
  expires_at?: string | null;  // ISO string
  is_active: boolean;
}

export interface DiscountCreateInput {
  code: string;
  percentage: number;
  expires_at?: string | null;  // ISO string
  is_active?: boolean;
}

export interface DiscountUpdateInput {
  code?: string;
  percentage?: number;
  expires_at?: string | null;
  is_active?: boolean;
}

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<BackendDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/discounts/");
      setDiscounts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching discounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDiscount = async (discountId: number): Promise<BackendDiscount> => {
    const data = await apiFetch(`/discounts/${discountId}`);
    return data;
  };

  const createDiscount = async (discountData: DiscountCreateInput): Promise<BackendDiscount> => {
    try {
      console.log("Creating discount:", discountData);
      
      const result = await apiFetch("/discounts/", {
        method: "POST",
        body: JSON.stringify(discountData),
      });
      
      console.log("Discount created:", result);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating discount:", err);
      throw err;
    }
  };

  const updateDiscount = async (discountId: number, discountData: DiscountUpdateInput): Promise<BackendDiscount> => {
    try {
      console.log(`Updating discount ${discountId}:`, discountData);
      
      const result = await apiFetch(`/discounts/${discountId}`, {
        method: "PUT",
        body: JSON.stringify(discountData),
      });
      
      console.log("Discount updated:", result);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating discount:", err);
      throw err;
    }
  };

  const deleteDiscount = async (discountId: number): Promise<void> => {
    try {
      console.log(`Deleting discount ${discountId}`);
      
      await apiFetch(`/discounts/${discountId}`, {
        method: "DELETE",
      });
      
      console.log("Discount deleted successfully");
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting discount:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  return {
    discounts,
    loading,
    error,
    refetch: fetchDiscounts,
    getDiscount,
    createDiscount,
    updateDiscount,
    deleteDiscount,
  };
}

