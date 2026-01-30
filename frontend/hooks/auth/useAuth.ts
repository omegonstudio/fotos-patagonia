"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch, getApiBaseUrl, refreshAccessToken } from "@/lib/api";
import { getTokenExpiration } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import type { LogoutOptions } from "@/lib/store";
import type { User } from "@/lib/types";

let authPromise: Promise<User | null> | null = null;

const resetAuthPromise = (promise?: Promise<User | null>) => {
  setTimeout(() => {
    if (!promise || authPromise === promise) {
      authPromise = null;
    }
  }, 100);
};

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const initialized = useAuthStore((state) => state.initialized);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const logoutStore = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(!initialized);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(
    async (force = false): Promise<User | null> => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }

      if (authPromise && !force) {
        return authPromise;
      }

      setLoading(true);

      const request = apiFetch<User>("/auth/me", { cache: "no-store" })
        .then((data) => {
          setUser(data);
          setError(null);
          return data;
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) {
            setUser(null);
            useAuthStore.getState().revalidateExpiration("auth/me-401");
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("No se pudo obtener la sesión actual.");
          }
          throw err;
        })
        .finally(() => {
          setLoading(false);
          resetAuthPromise(request);
        });

      authPromise = request;
      return request;
    },
    [token, setUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);

      try {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const detail =
            payload &&
            typeof payload === "object" &&
            "detail" in payload &&
            typeof (payload as Record<string, unknown>).detail === "string"
              ? (payload as Record<string, unknown>).detail
              : null;
          const message: string =
            typeof detail === "string"
              ? detail
              : "Usuario o contraseña incorrectos";
          throw new Error(message);
        }

        const data = await response.json();
        const accessToken = data?.access_token as string | undefined;
        if (!accessToken) {
          throw new Error("Respuesta inválida: falta el token de acceso.");
        }

        const expiresAt = getTokenExpiration(accessToken);
        if (!expiresAt) {
          throw new Error("El token recibido no tiene expiración.");
        }

        setToken(accessToken, expiresAt);
        await fetchMe(true);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo iniciar sesión.";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [fetchMe, setToken]
  );

  const logout = useCallback(
    async (options?: LogoutOptions) => {
      try {
        await apiFetch("/auth/logout", { method: "POST" });
      } catch {
        // Ignorar errores del backend al cerrar sesión
      } finally {
        logoutStore({
          ...options,
          reason: options?.reason ?? "manual",
        });
      }
    },
    [logoutStore]
  );

  const refresh = useCallback(async () => {
    const result = await refreshAccessToken();
    if (result?.access_token) {
      const expiresAt = getTokenExpiration(result.access_token);
      if (!expiresAt) {
        throw new Error("El token renovado no tiene expiración.");
      }
      setToken(result.access_token, expiresAt);
    }
    return result;
  }, [setToken]);

  useEffect(() => {
    if (!initialized) return;

    if (!token) {
      setLoading(false);
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    fetchMe().catch(() => null);
  }, [initialized, token, user, fetchMe]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refresh,
    refetch: () => fetchMe(true),
  };
}
