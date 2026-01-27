"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export interface PhotoSaleStat {
  photo_id: number;
  photo_filename: string;
  album_name: string | null;
  times_sold: number;
  total_revenue: number;
}

export function usePhotoSalesStats(photographerId: number | null) {
  const [data, setData] = useState<PhotoSaleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!photographerId || !token) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await apiFetch<PhotoSaleStat[]>(
          `/admin/stats/photographer/${photographerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(response);
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Error al cargar las estadísticas"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [photographerId, token]);

  return { data, loading, error };
}
