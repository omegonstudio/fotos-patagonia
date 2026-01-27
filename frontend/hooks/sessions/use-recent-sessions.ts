"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface RecentSession {
  id: number;
  photographer_name: string;
  start_time: string;
  total_photos: number;
  successful_uploads: number;
}

export function useRecentSessions() {
  const [data, setData] = useState<RecentSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecentSessions() {
    try {
      setLoading(true);
      const result = await apiFetch<RecentSession[]>("/admin/dashboard/recent-sessions");
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecentSessions();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchRecentSessions,
  };
}
