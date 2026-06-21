const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface Job {
  id: string;
  clip_id: string;
  status: JobStatus;
  progress: number;
  message: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clip {
  id: string;
  url: string;
  start_time: number;
  end_time: number;
  duration: number | null;
  title: string | null;
  video_path: string | null;
  clip_path: string | null;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
  job: Job | null;
}

export interface ClipListResponse {
  total: number;
  clips: Clip[];
}

export interface CreateClipPayload {
  url: string;
  start_time: number;
  end_time: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function createClip(payload: CreateClipPayload): Promise<Clip> {
  const res = await fetch(`${API_BASE}/clips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    const message =
      error?.detail?.[0]?.msg ||
      error?.detail ||
      "Failed to create clip";
    throw new Error(message);
  }

  return res.json();
}

export async function getClip(clipId: string): Promise<Clip> {
  const res = await fetch(`${API_BASE}/clips/${clipId}`);

  if (!res.ok) {
    throw new Error("Clip not found");
  }

  return res.json();
}

export async function listClips(skip = 0, limit = 20): Promise<ClipListResponse> {
  const res = await fetch(`${API_BASE}/clips?skip=${skip}&limit=${limit}`);

  if (!res.ok) {
    throw new Error("Failed to fetch clips");
  }

  return res.json();
}

export async function deleteClip(clipId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clips/${clipId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete clip");
  }
}

export function getClipDownloadUrl(clipId: string): string {
  return `${API_BASE}/files/clips/${clipId}`;
}

export function getThumbnailUrl(clipId: string): string {
  return `${API_BASE}/files/thumbnails/${clipId}`;
}
