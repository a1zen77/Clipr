"use client";

import { useQuery } from "@tanstack/react-query";
import { getClip, type Clip, type JobStatus } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClipProgressProps {
  clipId: string;
  onComplete: (clip: Clip) => void;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const variants: Record<JobStatus, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    processing: {
      label: "Processing",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    done: {
      label: "Done",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const { label, className } = variants[status] ?? variants.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function ProgressSteps({ progress }: { progress: number }) {
  const steps = [
    { label: "Queued",     threshold: 0  },
    { label: "Downloading", threshold: 10 },
    { label: "Clipping",   threshold: 40 },
    { label: "Thumbnail",  threshold: 80 },
    { label: "Done",       threshold: 100 },
  ];

  return (
    <div className="flex justify-between mt-2">
      {steps.map((step) => (
        <span
          key={step.label}
          className={`text-xs ${
            progress >= step.threshold
              ? "text-blue-600 font-medium"
              : "text-gray-400"
          }`}
        >
          {step.label}
        </span>
      ))}
    </div>
  );
}

export function ClipProgress({ clipId, onComplete }: ClipProgressProps) {
  const { data: clip, isError } = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => getClip(clipId),
    // Poll every 2 seconds until the job is done or failed
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      if (status === "done" || status === "failed") return false;
      return 2000;
    },
    // Fire onComplete when job finishes
    select: (data) => {
      if (data.job?.status === "done") {
        // Use setTimeout to avoid calling setState during render
        setTimeout(() => onComplete(data), 0);
      }
      return data;
    },
  });

  if (isError) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            ❌ Could not load clip status. The server may be unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!clip) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-2 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const job = clip.job;
  const status = job?.status ?? "pending";
  const progress = job?.progress ?? 0;
  const message = job?.message ?? "Waiting...";
  const error = job?.error;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Processing Clip</CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{message}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={
              status === "failed"
                ? "[&>div]:bg-red-500"
                : status === "done"
                ? "[&>div]:bg-green-500"
                : "[&>div]:bg-blue-500"
            }
          />
          <ProgressSteps progress={progress} />
        </div>

        {/* Clip metadata — shown once title is available */}
        {clip.title && (
          <div className="rounded-md bg-gray-50 border px-3 py-2">
            <p className="text-xs text-gray-500">Title</p>
            <p className="text-sm text-gray-800 font-medium truncate">
              {clip.title}
            </p>
          </div>
        )}

        {/* Error message */}
        {status === "failed" && error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-500 font-medium">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Clip ID for reference */}
        <p className="text-xs text-gray-400 font-mono truncate">
          ID: {clipId}
        </p>

      </CardContent>
    </Card>
  );
}
