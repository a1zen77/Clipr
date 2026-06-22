"use client";

import { useQuery } from "@tanstack/react-query";
import { getClip, type Clip, type JobStatus } from "@/lib/api";

interface ClipProgressProps {
  clipId: string;
  onComplete: (clip: Clip) => void;
}

const STEPS = [
  { label: "Queued",      threshold: 0   },
  { label: "Downloading", threshold: 10  },
  { label: "Clipping",    threshold: 40  },
  { label: "Thumbnail",   threshold: 80  },
  { label: "Done",        threshold: 100 },
];

function statusColor(status: JobStatus) {
  if (status === "done")   return "var(--success)";
  if (status === "failed") return "var(--error)";
  return "var(--accent)";
}

export function ClipProgress({ clipId, onComplete }: ClipProgressProps) {
  const { data: clip, isError } = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => getClip(clipId),
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      if (status === "done" || status === "failed") return false;
      return 2000;
    },
    select: (data) => {
      if (data.job?.status === "done") setTimeout(() => onComplete(data), 0);
      return data;
    },
  });

  if (isError) return (
    <div style={{
      background: "var(--error-dim)", border: "1px solid var(--error)",
      borderRadius: 12, padding: "1.25rem", fontSize: 13, color: "var(--error)",
    }}>
      Could not load clip status.
    </div>
  );

  const job      = clip?.job;
  const status   = (job?.status ?? "pending") as JobStatus;
  const progress = job?.progress ?? 0;
  const message  = job?.message  ?? "Waiting...";
  const color    = statusColor(status);

  const statusLabels: Record<JobStatus, string> = {
    pending: "Pending", processing: "Processing", done: "Done", failed: "Failed",
  };

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Processing</h2>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: color,
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 6,
          padding: "2px 8px",
        }}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{message}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color }}>{progress}%</span>
        </div>
        <div style={{
          height: 4,
          background: "var(--bg-elevated)",
          borderRadius: 99,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: status !== "failed" ? `0 0 8px ${color}60` : "none",
          }} />
        </div>
      </div>

      {/* Step labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {STEPS.map((step) => (
          <span key={step.label} style={{
            fontSize: 11,
            color: progress >= step.threshold ? color : "var(--text-muted)",
            fontWeight: progress >= step.threshold ? 500 : 400,
            transition: "color 0.3s",
          }}>
            {step.label}
          </span>
        ))}
      </div>

      {/* Title once available */}
      {clip?.title && (
        <div style={{
          marginTop: "1rem",
          padding: "10px 12px",
          background: "var(--bg-elevated)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}>
          <span style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 2 }}>Title</span>
          <span style={{ color: "var(--text-primary)" }}>{clip.title}</span>
        </div>
      )}

      {/* Error */}
      {status === "failed" && (
        <div style={{
          marginTop: "1rem",
          background: "var(--error-dim)",
          border: "1px solid var(--error)",
          borderRadius: 8,
          padding: "10px 12px",
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--error)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Failed
          </p>
          <p style={{ fontSize: 13, color: "var(--error)" }}>
            {job?.error ?? "An unexpected error occurred. Check the worker logs."}
          </p>
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
        {clipId}
      </p>
    </div>
  );
}
