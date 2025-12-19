"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendRole {
  id: number;
  name: string;
  description?: string;
  permissions: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
}

export function useRoles() {
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<BackendRole[]>("/roles/");
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRole = async (roleId: number): Promise<BackendRole> => {
    const data = await apiFetch<BackendRole>(`/roles/${roleId}`);
    return data;
  };

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
    getRole,
  };
}
