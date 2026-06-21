"use client";

import { getClipDownloadUrl, getThumbnailUrl, type Clip } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ClipResultCardProps {
  clip: Clip;
  onCreateAnother: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ClipResultCard({ clip, onCreateAnother }: ClipResultCardProps) {
  const duration = clip.end_time - clip.start_time;

  return (
    <Card className="w-full border-green-200 bg-green-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-green-800">
            ✅ Clip Ready
          </CardTitle>
          <span className="text-xs text-green-600 font-medium">
            {formatDuration(duration)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Thumbnail */}
        {clip.thumbnail_path && (
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100 border">
            <img
              src={getThumbnailUrl(clip.id)}
              alt={clip.title ?? "Clip thumbnail"}
              className="w-full h-full object-cover"
            />
            {/* Duration overlay */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(duration)}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          {clip.title && (
            <div>
              <p className="text-xs text-gray-500">Title</p>
              <p className="text-sm text-gray-800 font-medium line-clamp-2">
                {clip.title}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-white border px-3 py-2">
              <p className="text-xs text-gray-500">Start</p>
              <p className="text-sm font-medium text-gray-800">
                {formatTimestamp(clip.start_time)}
              </p>
            </div>
            <div className="rounded-md bg-white border px-3 py-2">
              <p className="text-xs text-gray-500">End</p>
              <p className="text-sm font-medium text-gray-800">
                {formatTimestamp(clip.end_time)}
              </p>
            </div>
            <div className="rounded-md bg-white border px-3 py-2">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDuration(duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => {
              const a = document.createElement("a");
              a.href = getClipDownloadUrl(clip.id);
              a.download = `clip-${clip.id}.mp4`;
              a.click();
            }}
          >
            ⬇ Download MP4
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCreateAnother}
          >
            Create Another
          </Button>
        </div>

        {/* Clip ID */}
        <p className="text-xs text-gray-400 font-mono truncate">
          ID: {clip.id}
        </p>

      </CardContent>
    </Card>
  );
}
