const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Clip {
  id: string;
  url: string;
  start_time: number;
  end_time: number;
  duration: number | null;
  title: string | null;
  clip_path: string | null;
  thumbnail_path: string | null;
  status: "pending" | "processing" | "done" | "failed";
  error: string | null;
  created_at: string;
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

export async function listClips(): Promise<ClipListResponse> {
  const res = await fetch(`${API_BASE}/clips`);
  if (!res.ok) throw new Error("Failed to fetch clips");
  return res.json();
}

export async function deleteClip(clipId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clips/${clipId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete clip");
}

export function getClipDownloadUrl(clipId: string): string {
  return `${API_BASE}/files/clips/${clipId}`;
}

export function getThumbnailUrl(clipId: string): string {
  return `${API_BASE}/files/thumbnails/${clipId}`;
}
