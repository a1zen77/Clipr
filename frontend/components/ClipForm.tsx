"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClip, type Clip } from "@/lib/api";

interface ClipFormProps {
  onClipCreated: (clip: Clip) => void;
}

interface FormErrors {
  url?: string;
  start_time?: string;
  end_time?: string;
}

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

function validateForm(url: string, startRaw: string, endRaw: string): FormErrors {
  const errors: FormErrors = {};
  if (!url.trim()) errors.url = "URL is required";
  else if (!url.includes("x.com") && !url.includes("twitter.com"))
    errors.url = "Must be an X/Twitter URL";
  const start = parseTimestamp(startRaw);
  const end   = parseTimestamp(endRaw);
  if (start === null) errors.start_time = "Enter seconds (e.g. 10) or MM:SS (e.g. 1:30)";
  if (end   === null) errors.end_time   = "Enter seconds (e.g. 30) or MM:SS (e.g. 2:00)";
  if (start !== null && end !== null) {
    if (end <= start)          errors.end_time = "End time must be after start time";
    else if (end - start > 300) errors.end_time = "Clip cannot exceed 5 minutes";
  }
  return errors;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s",
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

export function ClipForm({ onClipCreated }: ClipFormProps) {
  const [url, setUrl]           = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime]   = useState("");
  const [errors, setErrors]     = useState<FormErrors>({});
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createClip,
    onSuccess: (clip) => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      onClipCreated(clip);
      setUrl(""); setStartTime(""); setEndTime(""); setErrors({});
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formErrors = validateForm(url, startTime, endTime);
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }
    setErrors({});
    mutation.mutate({
      url: url.trim(),
      start_time: parseTimestamp(startTime)!,
      end_time:   parseTimestamp(endTime)!,
    });
  }

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "1.5rem",
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
        New clip
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* URL */}
        <div>
          <label style={labelStyle}>X / Twitter URL</label>
          <input
            type="url"
            placeholder="https://x.com/user/status/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={mutation.isPending}
            style={{
              ...inputStyle,
              borderColor: errors.url ? "var(--error)" : "var(--border)",
            }}
          />
          {errors.url && (
            <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>{errors.url}</p>
          )}
        </div>

        {/* Timestamps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Start time</label>
            <input
              placeholder="0 or 0:00"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={mutation.isPending}
              style={{
                ...inputStyle,
                borderColor: errors.start_time ? "var(--error)" : "var(--border)",
              }}
            />
            {errors.start_time && (
              <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>{errors.start_time}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>End time</label>
            <input
              placeholder="30 or 0:30"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={mutation.isPending}
              style={{
                ...inputStyle,
                borderColor: errors.end_time ? "var(--error)" : "var(--border)",
              }}
            />
            {errors.end_time && (
              <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>{errors.end_time}</p>
            )}
          </div>
        </div>

        {/* API error */}
        {mutation.isError && (
          <div style={{
            background: "var(--error-dim)",
            border: "1px solid var(--error)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            color: "var(--error)",
          }}>
            {mutation.error?.message || "Something went wrong"}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            background: mutation.isPending ? "var(--accent-dim)" : "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "11px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: mutation.isPending ? "not-allowed" : "pointer",
            transition: "background 0.15s, opacity 0.15s",
            opacity: mutation.isPending ? 0.7 : 1,
          }}
        >
          {mutation.isPending ? "Submitting..." : "Create clip →"}
        </button>
      </form>
    </div>
  );
}
