"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipForm } from "@/components/ClipForm";
import { ClipProgress } from "@/components/ClipProgress";
import { ClipResultCard } from "@/components/ClipResultCard";
import { ClipHistoryList } from "@/components/ClipHistoryList";
import { EmptyState } from "@/components/EmptyState";
import { listClips, type Clip } from "@/lib/api";

export default function Home() {
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [completedClip, setCompletedClip] = useState<Clip | null>(null);

  const { data } = useQuery({
    queryKey: ["clips"],
    queryFn: () => listClips(0, 20),
    refetchInterval: 5000,
  });

  const hasHistory = (data?.total ?? 0) > 0;

  function handleClipCreated(clip: Clip) {
    setActiveClip(clip);
    setCompletedClip(null);
  }

  function handleComplete(clip: Clip) {
    setCompletedClip(clip);
  }

  function handleCreateAnother() {
    setActiveClip(null);
    setCompletedClip(null);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Hero text — only shown when no active job */}
        {!activeClip && !completedClip && (
          <div className="text-center space-y-1 pt-2 pb-2">
            <p className="text-gray-500 text-sm">
              Paste a URL · Set timestamps · Download your clip
            </p>
          </div>
        )}

        {/* Form */}
        {!activeClip && !completedClip && (
          <ClipForm onClipCreated={handleClipCreated} />
        )}

        {/* Progress tracker */}
        {activeClip && !completedClip && (
          <ClipProgress
            clipId={activeClip.id}
            onComplete={handleComplete}
          />
        )}

        {/* Result card */}
        {completedClip && (
          <ClipResultCard
            clip={completedClip}
            onCreateAnother={handleCreateAnother}
          />
        )}

        {/* Divider between active area and history */}
        {hasHistory && (
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              History
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
        )}

        {/* History list or empty state */}
        {hasHistory ? (
          <ClipHistoryList />
        ) : (
          !activeClip && !completedClip && <EmptyState />
        )}

      </div>
    </main>
  );
}
