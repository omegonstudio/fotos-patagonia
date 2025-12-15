import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { Photographer, Earning } from "@/lib/types";

export interface PhotographerEarningsSummary {
  total_earnings: number;
  total_earned_photo_fraction: number;
  total_orders_involved: number;
  photographer_id: number;
  start_date: string | null;
  end_date: string | null;
}

export function usePhotographers() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotographers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Photographer[]>("/photographers/");
      setPhotographers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching photographers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPhotographer = async (photographerId: number) => {
    return apiFetch<Photographer>(`/photographers/${photographerId}`);
  };

  const createPhotographer = async (photographerData: Partial<Photographer>) => {
    const data = await apiFetch<Photographer>("/photographers/", {
      method: "POST",
      body: JSON.stringify(photographerData),
    });

    setPhotographers((prev) => [...prev, data]);
    return data;
  };

  const updatePhotographer = async (photographerId: number, updates: Partial<Photographer>) => {
    const data = await apiFetch<Photographer>(`/photographers/${photographerId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    setPhotographers((prev) =>
      prev.map((ph) => (ph.id === photographerId ? { ...ph, ...data } : ph))
    );

    return data;
  };

  const deletePhotographer = async (photographerId: number) => {
    await apiFetch(`/photographers/${photographerId}`, {
      method: "DELETE",
    });

    setPhotographers((prev) => prev.filter((ph) => ph.id !== photographerId));
  };

  // Earnings
  const getPhotographerEarnings = async (
    photographerId: number,
    params?: { startDate?: string; endDate?: string }
  ) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append("start_date", params.startDate);
    if (params?.endDate) qs.append("end_date", params.endDate);

    const url = `/photographers/${photographerId}/earnings${qs.toString() ? `?${qs}` : ""}`;
    return apiFetch<Earning[]>(url);
  };

  const getPhotographerEarningsSummary = async (
    photographerId: number,
    params?: { startDate?: string; endDate?: string }
  ) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append("start_date", params.startDate);
    if (params?.endDate) qs.append("end_date", params.endDate);

    const url = `/photographers/${photographerId}/earnings/summary${qs.toString() ? `?${qs}` : ""}`;

    return apiFetch<PhotographerEarningsSummary>(url);
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
    getPhotographerEarnings,
    getPhotographerEarningsSummary,
  };
}
