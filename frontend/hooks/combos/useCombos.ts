"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendCombo {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  totalPhotos: number;
  isFullAlbum: boolean;
  active: boolean;
}

export interface ComboCreateInput {
  name: string;
  description?: string | null;
  price: number;
  totalPhotos: number;
  isFullAlbum: boolean;
  active?: boolean;
}

export interface ComboUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  totalPhotos?: number;
  isFullAlbum?: boolean;
  active?: boolean;
}

export function useCombos() {
  const [combos, setCombos] = useState<BackendCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/combos/");
      setCombos(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching combos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCombo = async (comboId: number): Promise<BackendCombo> => {
    const data = await apiFetch(`/combos/${comboId}`);
    return data;
  };

  const createCombo = async (comboData: ComboCreateInput): Promise<BackendCombo> => {
    try {
      console.log("Creating combo:", comboData);
      
      const result = await apiFetch("/combos/", {
        method: "POST",
        body: JSON.stringify(comboData),
      });
      
      console.log("Combo created:", result);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating combo:", err);
      throw err;
    }
  };

  const updateCombo = async (comboId: number, comboData: ComboUpdateInput): Promise<BackendCombo> => {
    try {
      console.log(`Updating combo ${comboId}:`, comboData);
      
      const result = await apiFetch(`/combos/${comboId}`, {
        method: "PUT",
        body: JSON.stringify(comboData),
      });
      
      console.log("Combo updated:", result);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating combo:", err);
      throw err;
    }
  };

  const deleteCombo = async (comboId: number): Promise<void> => {
    try {
      console.log(`Deleting combo ${comboId}`);
      
      await apiFetch(`/combos/${comboId}`, {
        method: "DELETE",
      });
      
      console.log("Combo deleted successfully");
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting combo:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  return {
    combos,
    loading,
    error,
    refetch: fetchCombos,
    getCombo,
    createCombo,
    updateCombo,
    deleteCombo,
  };
}

