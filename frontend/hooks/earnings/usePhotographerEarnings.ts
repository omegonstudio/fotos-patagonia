"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Earning } from "@/lib/types"; // Asumiré que este tipo existe o lo crearé

export function usePhotographerEarnings(photographerId: string | number | undefined) {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    if (!photographerId) {
      setEarnings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch<Earning[]>(`/photographers/${photographerId}/earnings`);
      setEarnings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching photographer earnings:", err);
    } finally {
      setLoading(false);
    }
  }, [photographerId]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    earnings,
    loading,
    error,
    refetch: fetchEarnings,
  };
}
