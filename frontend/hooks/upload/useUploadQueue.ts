"use client";

import { create } from "zustand";

export type UploadStatus = "queued" | "uploading" | "success" | "partial" | "error";

export interface UploadFailedFile {
  name: string;
  reason: string;
  attempts: number;
  kind?: string;
  statusCode?: number;
  retryable?: boolean;
}

export interface UploadJob {
  id: string;
  title: string;
  filesCount: number;
  progress: number; // 0-100
  status: UploadStatus;
  error?: string;
  createdAt: number;
  totalFiles?: number;
  successCount?: number;
  failedCount?: number;
  failedFiles?: UploadFailedFile[];
}

interface UploadQueueState {
  jobs: UploadJob[];
  enqueue: (job: Omit<UploadJob, "createdAt" | "status" | "progress"> & Partial<Pick<UploadJob, "status" | "progress">>) => void;
  updateProgress: (id: string, progress: number) => void;
  markSuccess: (id: string) => void;
  markError: (id: string, error: string) => void;
  markPartial: (id: string, summary?: Partial<Pick<UploadJob, "error" | "failedFiles" | "failedCount" | "successCount" | "totalFiles">>) => void;
  setResult: (id: string, result: Partial<UploadJob>) => void;
  remove: (id: string) => void;
}

export const useUploadQueueStore = create<UploadQueueState>((set) => ({
  jobs: [],
  enqueue: (job) =>
    set((state) => ({
      jobs: [
        ...state.jobs,
        {
          ...job,
          progress: job.progress ?? 0,
          status: job.status ?? "uploading",
          createdAt: Date.now(),
        },
      ],
    })),
  updateProgress: (id, progress) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, progress, status: "uploading" } : job
      ),
    })),
  markSuccess: (id) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, status: "success", progress: 100 } : job
      ),
    })),
  markError: (id, error) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, status: "error", error } : job
      ),
    })),
  markPartial: (id, summary) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              status: "partial",
              progress: 100,
              error: summary?.error ?? job.error,
              failedFiles: summary?.failedFiles ?? job.failedFiles,
              failedCount: summary?.failedCount ?? job.failedCount,
              successCount: summary?.successCount ?? job.successCount,
              totalFiles: summary?.totalFiles ?? job.totalFiles,
            }
          : job
      ),
    })),
  setResult: (id, result) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              ...result,
            }
          : job
      ),
    })),
  remove: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),
}));

