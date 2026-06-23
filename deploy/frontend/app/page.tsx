"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClip,
  listClips,
  deleteClip,
  getClipDownloadUrl,
  getThumbnailUrl,
  type Clip,
} from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTimestamp(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) return parts[0] * 60 + parts[1];
    return null;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--text-primary)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 6,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(14,15,17,0.85)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 680, margin: "0 auto", padding: "0 1.5rem",
        height: 52, display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: "var(--accent-dim)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>✂</span>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
          Clipper
        </span>
        <span style={{
          fontSize: 11, color: "var(--text-muted)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 4, padding: "2px 6px", marginLeft: 4,
        }}>
          MVP
        </span>
      </div>
    </header>
  );
}

// ─── Clip Form ────────────────────────────────────────────────────────────────

interface FormErrors {
  url?: string;
  start_time?: string;
  end_time?: string;
}

function ClipForm({ onDone }: { onDone: (clip: Clip) => void }) {
  const [url, setUrl]             = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime]     = useState("");
  const [errors, setErrors]       = useState<FormErrors>({});
  const queryClient               = useQueryClient();

  const mutation = useMutation({
    mutationFn: createClip,
    onSuccess: (clip) => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      onDone(clip);
      setUrl(""); setStartTime(""); setEndTime(""); setErrors({});
    },
  });

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!url.trim()) e.url = "URL is required";
    else if (!url.includes("x.com") && !url.includes("twitter.com"))
      e.url = "Must be an X/Twitter URL";
    const start = parseTimestamp(startTime);
    const end   = parseTimestamp(endTime);
    if (start === null) e.start_time = "Enter seconds (e.g. 10) or MM:SS";
    if (end   === null) e.end_time   = "Enter seconds (e.g. 40) or MM:SS";
    if (start !== null && end !== null) {
      if (end <= start)      e.end_time = "End time must be after start time";
      else if (end - start > 60) e.end_time = "Max 60 seconds on free tier";
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    mutation.mutate({
      url: url.trim(),
      start_time: parseTimestamp(startTime)!,
      end_time:   parseTimestamp(endTime)!,
    });
  }

  return (
    <div style={{ ...cardStyle, padding: "1.5rem" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
        New clip
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>X / Twitter URL</label>
          <input
            type="url" placeholder="https://x.com/user/status/..."
            value={url} onChange={(e) => setUrl(e.target.value)}
            disabled={mutation.isPending}
            style={{ ...inputStyle, borderColor: errors.url ? "var(--error)" : "var(--border)" }}
          />
          {errors.url && <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>{errors.url}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Start time</label>
            <input
              placeholder="0 or 0:00" value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={mutation.isPending}
              style={{ ...inputStyle, borderColor: errors.start_time ? "var(--error)" : "var(--border)" }}
            />
            {errors.start_time && <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>{errors.start_time}</p>}
          </div>
          <div>
            <label style={labelStyle}>End time</label>
            <input
              placeholder="30 or 0:30" value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={mutation.isPending}
              style={{ ...inputStyle, borderColor: errors.end_time ? "var(--error)" : "var(--border)" }}
            />
            {errors.end_time && <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>{errors.end_time}</p>}
          </div>
        </div>

        {mutation.isError && (
          <div style={{
            background: "#450a0a20", border: "1px solid var(--error)",
            borderRadius: 8, padding: "10px 12px",
            fontSize: 13, color: "var(--error)",
          }}>
            {mutation.error?.message || "Something went wrong"}
          </div>
        )}

        {mutation.isPending && (
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8, padding: "12px",
            fontSize: 13, color: "var(--text-secondary)",
            textAlign: "center",
          }}>
            <span style={{ marginRight: 8 }}>⏳</span>
            Processing your clip — this takes 15–30 seconds...
          </div>
        )}

        <button
          type="submit" disabled={mutation.isPending}
          style={{
            background: mutation.isPending ? "var(--accent-dim)" : "var(--accent)",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "11px 16px", fontSize: 14, fontWeight: 600,
            cursor: mutation.isPending ? "not-allowed" : "pointer",
            opacity: mutation.isPending ? 0.7 : 1,
          }}
        >
          {mutation.isPending ? "Processing..." : "Create clip →"}
        </button>
      </form>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ clip, onCreateAnother }: { clip: Clip; onCreateAnother: () => void }) {
  const duration = clip.end_time - clip.start_time;

  if (clip.status === "failed") {
    return (
      <div style={{ ...cardStyle, padding: "1.5rem" }}>
        <div style={{
          background: "#450a0a20", border: "1px solid var(--error)",
          borderRadius: 8, padding: "12px", marginBottom: "1rem",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--error)", marginBottom: 4 }}>Failed</p>
          <p style={{ fontSize: 13, color: "var(--error)" }}>{clip.error ?? "An unexpected error occurred"}</p>
        </div>
        <button
          onClick={onCreateAnother}
          style={{
            width: "100%", background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)", borderRadius: 8,
            padding: "11px 16px", fontSize: 14, cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, overflow: "hidden" }}>
      {clip.thumbnail_path && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "var(--bg-base)" }}>
          <img
            src={getThumbnailUrl(clip.id)}
            alt={clip.title ?? "Clip thumbnail"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(0,0,0,0.75)", color: "#fff",
            fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
          }}>
            {fmt(duration)}
          </div>
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "var(--success)", color: "#000",
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
          }}>
            READY
          </div>
        </div>
      )}
      <div style={{ padding: "1.25rem" }}>
        {clip.title && (
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
            {clip.title}
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: "1.25rem" }}>
          {[
            { label: "Start",    value: fmt(clip.start_time) },
            { label: "End",      value: fmt(clip.end_time)   },
            { label: "Duration", value: fmt(duration)         },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
              borderRadius: 8, padding: "8px 10px",
            }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase" }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = getClipDownloadUrl(clip.id);
              a.download = `clip-${clip.id}.mp4`;
              a.click();
            }}
            style={{
              flex: 1, background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8,
              padding: "11px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            ↓ Download MP4
          </button>
          <button
            onClick={onCreateAnother}
            style={{
              flex: 1, background: "transparent", color: "var(--text-secondary)",
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "11px 16px", fontSize: 14, cursor: "pointer",
            }}
          >
            New clip
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────

function HistoryList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["clips"],
    queryFn:  listClips,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClip,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clips"] }),
  });

  if (isLoading) return null;
  const clips = data?.clips ?? [];
  if (clips.length === 0) return null;

  return (
    <div style={cardStyle}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 1.25rem", borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>History</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{data?.total} total</span>
      </div>
      {clips.map((clip, i) => (
        <div key={clip.id} style={{
          display: "flex", gap: 14, padding: "14px 1.25rem",
          borderBottom: i < clips.length - 1 ? "1px solid var(--border-subtle)" : "none",
        }}>
          <div style={{
            width: 80, height: 48, flexShrink: 0, borderRadius: 6,
            overflow: "hidden", background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {clip.thumbnail_path
              ? <img src={getThumbnailUrl(clip.id)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "var(--text-muted)", fontSize: 16 }}>
                  {clip.status === "failed" ? "✕" : "▶"}
                </span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                textTransform: "uppercase", borderRadius: 5, padding: "2px 7px",
                color: clip.status === "done" ? "var(--success)" : clip.status === "failed" ? "var(--error)" : "var(--warning)",
                background: clip.status === "done" ? "#14532d20" : clip.status === "failed" ? "#450a0a20" : "#78350f20",
                border: `1px solid ${clip.status === "done" ? "var(--success)" : clip.status === "failed" ? "var(--error)" : "var(--warning)"}40`,
              }}>
                {clip.status}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(clip.created_at)}</span>
            </div>
            <p style={{
              fontSize: 13, color: "var(--text-primary)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {clip.title ?? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>No title</span>}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {fmt(clip.end_time - clip.start_time)}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", flexShrink: 0 }}>
            {clip.status === "done" && (
              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = getClipDownloadUrl(clip.id);
                  a.download = `clip-${clip.id}.mp4`;
                  a.click();
                }}
                style={{
                  background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                ↓ Download
              </button>
            )}
            <button
              onClick={() => deleteMutation.mutate(clip.id)}
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
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [completedClip, setCompletedClip] = useState<Clip | null>(null);

  return (
    <main style={{ minHeight: "100vh", width: "100%", background: "var(--bg-base)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 680, padding: "2rem 1.5rem 4rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        <Navbar />

        {!completedClip && (
          <div style={{ paddingTop: "0.5rem" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              Paste a URL · set timestamps (max 60s) · download your clip
            </p>
          </div>
        )}

        {!completedClip
          ? <ClipForm onDone={(clip) => setCompletedClip(clip)} />
          : <ResultCard clip={completedClip} onCreateAnother={() => setCompletedClip(null)} />
        }

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>History</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>

        <HistoryList />

      </div>
    </main>
  );
}
