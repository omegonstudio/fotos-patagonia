"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { Photographer } from "@/lib/types";

export function usePhotographers() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotographers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/photographers/");
      setPhotographers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching photographers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPhotographer = async (photographerId: number): Promise<Photographer> => {
    const data = await apiFetch(`/photographers/${photographerId}`);
    return data;
  };

  const createPhotographer = async (photographerData: Partial<Photographer>) => {
    const data = await apiFetch("/photographers/", {
      method: "POST",
      body: JSON.stringify(photographerData),
    });
    
    setPhotographers((prev) => [...prev, data]);
    return data;
  };

  const updatePhotographer = async (photographerId: number, updates: Partial<Photographer>) => {
    const data = await apiFetch(`/photographers/${photographerId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    
    setPhotographers((prev) =>
      prev.map((photographer) => (photographer.id === photographerId ? { ...photographer, ...data } : photographer))
    );
    
    return data;
  };

  const deletePhotographer = async (photographerId: number) => {
    await apiFetch(`/photographers/${photographerId}`, {
      method: "DELETE",
    });
    
    setPhotographers((prev) => prev.filter((photographer) => photographer.id !== photographerId));
  };

  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  return {
    photographers,
    loading,
    error,
    refetch: fetchPhotographers,
    getPhotographer,
    createPhotographer,
    updatePhotographer,
    deletePhotographer,
  };
}
