"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendSession {
  id: number;
  event_name: string;
  description?: string | null;
  event_date: string; // ISO string
  location: string;
  photographer_id: number;
  album_id: number;
  photographer?: {
    id: number;
    name: string;
    email?: string;
    commission?: number;
  };
  album?: {
    id: number;
    name: string;
    description?: string;
  };
  photos?: any[];
}

export interface SessionCreateInput {
  event_name: string;
  description?: string;
  event_date: string; // ISO string
  location: string;
  photographer_id: number;
  album_id: number;
}

export interface SessionUpdateInput {
  event_name?: string;
  description?: string;
  event_date?: string; // ISO string
  location?: string;
  photographer_id?: number;
}

export function useSessions() {
  const [sessions, setSessions] = useState<BackendSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<BackendSession[]>("/sessions/");
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSession = async (sessionId: number): Promise<BackendSession> => {
    const data = await apiFetch<BackendSession>(`/sessions/${sessionId}`);
    return data;
  };

  const createSession = async (
    sessionData: SessionCreateInput
  ): Promise<BackendSession> => {
    try {
      console.log("Creating session:", sessionData);

      const data = await apiFetch<BackendSession>("/sessions/", {
        method: "POST",
        body: JSON.stringify(sessionData),
      });

      console.log("Session created:", data);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating session:", err);
      throw err;
    }
  };

  const updateSession = async (
    sessionId: number,
    updates: SessionUpdateInput
  ): Promise<BackendSession> => {
    try {
      console.log(`Updating session ${sessionId}:`, updates);

      const data = await apiFetch<BackendSession>(`/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      console.log("Session updated:", data);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating session:", err);
      throw err;
    }
  };

  const deleteSession = async (sessionId: number): Promise<void> => {
    try {
      console.log(`Deleting session ${sessionId}`);

      await apiFetch(`/sessions/${sessionId}`, {
        method: "DELETE",
      });

      console.log("Session deleted successfully");
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting session:", err);
      throw err;
    }
  };

  const sendCartLink = async (sessionId: number): Promise<any> => {
    try {
      console.log(`Sending cart link for session ${sessionId}`);

      const data = await apiFetch(`/sessions/${sessionId}/send-cart-link`, {
        method: "POST",
      });

      console.log("Cart link sent:", data);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error("Error sending cart link:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    sendCartLink,
  };
}
