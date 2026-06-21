"use client";

import { useQuery } from "@tanstack/react-query";
import { listClips } from "@/lib/api";

export function Navbar() {
  const { data } = useQuery({
    queryKey: ["clips"],
    queryFn: () => listClips(0, 20),
  });

  const total = data?.total ?? 0;
  const done = data?.clips.filter((c) => c.job?.status === "done").length ?? 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <span className="font-semibold text-gray-900">
            Social Video Clipper
          </span>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{total} clip{total !== 1 ? "s" : ""}</span>
            <span className="text-gray-300">|</span>
            <span className="text-green-600 font-medium">
              {done} ready
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
