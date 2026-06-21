"use client";

import { getClipDownloadUrl, getThumbnailUrl, type Clip } from "@/lib/api";

interface ClipResultCardProps {
  clip: Clip;
  onCreateAnother: () => void;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ts(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ClipResultCard({ clip, onCreateAnother }: ClipResultCardProps) {
  const duration = clip.end_time - clip.start_time;

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Thumbnail */}
      {clip.thumbnail_path && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "var(--bg-base)" }}>
          <img
            src={getThumbnailUrl(clip.id)}
            alt={clip.title ?? "Clip thumbnail"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
          }}>
            {fmt(duration)}
          </div>
          {/* Ready badge */}
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "var(--success)",
            color: "#000",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            letterSpacing: "0.03em",
          }}>
            READY
          </div>
        </div>
      )}

      <div style={{ padding: "1.25rem" }}>
        {/* Title */}
        {clip.title && (
          <p style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "1rem",
            lineHeight: 1.4,
          }}>
            {clip.title}
          </p>
        )}

        {/* Metadata */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: "1.25rem",
        }}>
          {[
            { label: "Start",    value: ts(clip.start_time) },
            { label: "End",      value: ts(clip.end_time)   },
            { label: "Duration", value: fmt(duration)        },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              padding: "8px 10px",
            }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = getClipDownloadUrl(clip.id);
              a.download = `clip-${clip.id}.mp4`;
              a.click();
            }}
            style={{
              flex: 1,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↓ Download MP4
          </button>
          <button
            onClick={onCreateAnother}
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            New clip
          </button>
        </div>

        <p style={{ marginTop: "0.75rem", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
          {clip.id}
        </p>
      </div>
    </div>
  );
}
