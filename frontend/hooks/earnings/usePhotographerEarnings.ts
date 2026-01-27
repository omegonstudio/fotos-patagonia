"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Earning } from "@/lib/types";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

const LIMIT = 15;

export function usePhotographerEarnings(photographerId: string | number | undefined) {
  const [data, setData] = useState<PaginatedResponse<Earning>>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    if (!photographerId) {
      setData({ items: [], total: 0 });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const skip = (page - 1) * LIMIT;
      const response = await apiFetch<PaginatedResponse<Earning>>(
        `/photographers/${photographerId}/earnings?skip=${skip}&limit=${LIMIT}`
      );
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching photographer earnings:", err);
    } finally {
      setLoading(false);
    }
  }, [photographerId, page]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    earnings: data.items,
    total: data.total,
    page,
    setPage,
    limit: LIMIT,
    loading,
    error,
    refetch: fetchEarnings,
  };
}
