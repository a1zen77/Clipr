"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listClips,
  deleteClip,
  getClipDownloadUrl,
  getThumbnailUrl,
  type Clip,
  type JobStatus,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    pending:    "bg-yellow-100 text-yellow-700 border-yellow-200",
    processing: "bg-blue-100   text-blue-700   border-blue-200",
    done:       "bg-green-100  text-green-700  border-green-200",
    failed:     "bg-red-100    text-red-700    border-red-200",
  };
  const labels: Record<JobStatus, string> = {
    pending:    "Pending",
    processing: "Processing",
    done:       "Done",
    failed:     "Failed",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ─── Single history row ───────────────────────────────────────────────────────

function ClipHistoryRow({
  clip,
  onDelete,
}: {
  clip: Clip;
  onDelete: (id: string) => void;
}) {
  const status = clip.job?.status ?? "pending";
  const duration = clip.end_time - clip.start_time;

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail or placeholder */}
      <div className="w-28 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border">
        {clip.thumbnail_path ? (
          <img
            src={getThumbnailUrl(clip.id)}
            alt={clip.title ?? "Clip thumbnail"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            {status === "processing" ? "⏳" : status === "failed" ? "❌" : "🎬"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={status} />
          <span className="text-xs text-gray-400">
            {formatDate(clip.created_at)}
          </span>
        </div>

        <p className="text-sm font-medium text-gray-800 truncate">
          {clip.title ?? (
            <span className="text-gray-400 font-normal">No title yet</span>
          )}
        </p>

        <p className="text-xs text-gray-400 truncate">{clip.url}</p>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Duration: {formatDuration(duration)}</span>
          {clip.job?.progress !== undefined && status !== "done" && (
            <span>{clip.job.progress}%</span>
          )}
          {clip.job?.message && status !== "done" && (
            <span className="truncate text-gray-400">{clip.job.message}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
        {status === "done" && (
          <Button
            size="sm"
            onClick={() => {
              const a = document.createElement("a");
              a.href = getClipDownloadUrl(clip.id);
              a.download = `clip-${clip.id}.mp4`;
              a.click();
            }}
          >
            ⬇ Download
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete(clip.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClipHistoryList() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clips"],
    queryFn: () => listClips(0, 20),
    refetchInterval: 5000, // refresh list every 5s in case statuses change
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Recent Clips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-28 h-16 bg-gray-200 rounded-md" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            ❌ Could not load clip history.
          </p>
        </CardContent>
      </Card>
    );
  }

  const clips = data?.clips ?? [];
  const total = data?.total ?? 0;

  if (clips.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Recent Clips</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-6">
            No clips yet. Submit one above to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Clips</CardTitle>
          <span className="text-xs text-gray-400">{total} total</span>
        </div>
      </CardHeader>
      <CardContent className="px-6">
        {clips.map((clip, index) => (
          <div key={clip.id}>
            <ClipHistoryRow
              clip={clip}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
            {index < clips.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
