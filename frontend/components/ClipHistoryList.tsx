"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClips, deleteClip, getClipDownloadUrl, getThumbnailUrl, type Clip, type JobStatus } from "@/lib/api";

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatusPill({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { color: string; bg: string }> = {
    pending:    { color: "var(--warning)",  bg: "#78350f20" },
    processing: { color: "var(--accent)",   bg: "#3D378020" },
    done:       { color: "var(--success)",  bg: "#14532d20" },
    failed:     { color: "var(--error)",    bg: "#450a0a20" },
  };
  const labels: Record<JobStatus, string> = {
    pending: "Pending", processing: "Processing", done: "Done", failed: "Failed",
  };
  const { color, bg } = map[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase", color, background: bg,
      border: `1px solid ${color}40`, borderRadius: 5, padding: "2px 7px",
    }}>
      {labels[status]}
    </span>
  );
}

function ClipRow({ clip, onDelete }: { clip: Clip; onDelete: (id: string) => void }) {
  const status   = (clip.job?.status ?? "pending") as JobStatus;
  const duration = clip.end_time - clip.start_time;

  return (
    <div style={{
      display: "flex",
      gap: 14,
      padding: "14px 0",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 100, height: 58, flexShrink: 0,
        borderRadius: 6, overflow: "hidden",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>
        {clip.thumbnail_path ? (
          <img src={getThumbnailUrl(clip.id)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ color: "var(--text-muted)" }}>
            {status === "processing" ? "⏳" : status === "failed" ? "✕" : "▶"}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <StatusPill status={status} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(clip.created_at)}</span>
        </div>
        <p style={{
          fontSize: 13, fontWeight: 500, color: "var(--text-primary)",
          marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {clip.title ?? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Processing...</span>}
        </p>
        <p style={{
          fontSize: 11, color: "var(--text-muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {fmt(duration)} · {clip.url}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", flexShrink: 0 }}>
        {status === "done" && (
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = getClipDownloadUrl(clip.id);
              a.download = `clip-${clip.id}.mp4`;
              a.click();
            }}
            style={{
              background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            ↓ Download
          </button>
        )}
        <button
          onClick={() => onDelete(clip.id)}
          style={{
            background: "transparent", color: "var(--text-muted)",
            border: "1px solid var(--border)", borderRadius: 6,
            padding: "5px 12px", fontSize: 12, cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function ClipHistoryList() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clips"],
    queryFn: () => listClips(0, 20),
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClip,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clips"] }),
  });

  if (isLoading) return (
    <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ width: 100, height: 58, background: "var(--bg-elevated)", borderRadius: 6 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, background: "var(--bg-elevated)", borderRadius: 4, width: "30%", marginBottom: 8 }} />
            <div style={{ height: 12, background: "var(--bg-elevated)", borderRadius: 4, width: "70%" }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (isError) return (
    <div style={{ padding: "1rem", background: "var(--error-dim)", border: "1px solid var(--error)", borderRadius: 12, fontSize: 13, color: "var(--error)" }}>
      Could not load clip history.
    </div>
  );

  const clips = data?.clips ?? [];
  const total = data?.total ?? 0;

  if (clips.length === 0) return null;

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "0 1.25rem" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 0", borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>History</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} total</span>
      </div>
      {clips.map((clip) => (
        <ClipRow key={clip.id} clip={clip} onDelete={(id) => deleteMutation.mutate(id)} />
      ))}
    </div>
  );
}
