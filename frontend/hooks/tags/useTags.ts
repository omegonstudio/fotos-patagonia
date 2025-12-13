"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendTag {
  id: number;
  name: string;
}

export function useTags() {
  const [tags, setTags] = useState<BackendTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/tags/");
      setTags(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching tags:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTag = async (tagId: number): Promise<BackendTag> => {
    const data = await apiFetch(`/tags/${tagId}`);
    return data;
  };

  const createTag = async (name: string): Promise<BackendTag> => {
    try {
      console.log("Creating tag with name:", name);
      
      const result = await apiFetch("/tags/", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      
      console.log("Tag created:", result);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating tag:", err);
      throw err;
    }
  };

  const updateTag = async (tagId: number, name: string): Promise<BackendTag> => {
    try {
      console.log(`Updating tag ${tagId} with name:`, name);
      
      const result = await apiFetch(`/tags/${tagId}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      
      console.log("Tag updated:", result);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating tag:", err);
      throw err;
    }
  };

  const deleteTag = async (tagId: number): Promise<void> => {
    try {
      console.log(`Deleting tag ${tagId}`);
      
      await apiFetch(`/tags/${tagId}`, {
        method: "DELETE",
      });
      
      console.log("Tag deleted successfully");
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting tag:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
  };
}

