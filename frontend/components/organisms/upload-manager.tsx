"use client";

import { useState, useMemo } from "react";
import { X, Minus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useUploadQueueStore } from "@/hooks/upload/useUploadQueue";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function UploadManager() {
  const { jobs, remove } = useUploadQueueStore();
  const [collapsed, setCollapsed] = useState(false);

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "uploading" || j.status === "queued"),
    [jobs]
  );
  const visibleJobs = jobs.slice(-4); // limitar visualmente

  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      <Card className="shadow-lg border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className={cn("h-4 w-4", activeJobs.length ? "animate-spin text-primary" : "text-muted-foreground")} />
            <p className="text-sm font-semibold">Subidas en progreso</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)} aria-label="Colapsar" className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => visibleJobs.forEach((j) => remove(j.id))} aria-label="Cerrar" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="space-y-3 px-4 pb-4">
            {visibleJobs.map((job) => (
              <div key={job.id} className="rounded-lg border border-gray-100 p-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.filesCount} archivo{job.filesCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {job.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {job.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
                <div className="mt-2">
                  <Progress value={job.progress} className="h-2" />
                </div>
                {job.error && <p className="mt-1 text-xs text-destructive">{job.error}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

