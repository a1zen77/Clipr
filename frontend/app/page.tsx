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
  const [activeClip, setActiveClip]       = useState<Clip | null>(null);
  const [completedClip, setCompletedClip] = useState<Clip | null>(null);

  const { data } = useQuery({
    queryKey: ["clips"],
    queryFn: () => listClips(0, 20),
    refetchInterval: 5000,
  });

  const hasHistory = (data?.total ?? 0) > 0;

  function handleClipCreated(clip: Clip) { setActiveClip(clip); setCompletedClip(null); }
  function handleComplete(clip: Clip)    { setCompletedClip(clip); }
  function handleCreateAnother()         { setActiveClip(null); setCompletedClip(null); }

  return (
    <main style={{
      minHeight: "100vh",
      width: "100%",
      background: "var(--bg-base)",
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 680,
        padding: "2rem 1.5rem 4rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}>

        {/* Hero */}
        {!activeClip && !completedClip && (
          <div style={{ paddingTop: "1rem", paddingBottom: "0.5rem" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              Paste a URL · set timestamps · download your clip
            </p>
          </div>
        )}

        {/* Form */}
        {!activeClip && !completedClip && (
          <ClipForm onClipCreated={handleClipCreated} />
        )}

        {/* Progress */}
        {activeClip && !completedClip && (
          <ClipProgress clipId={activeClip.id} onComplete={handleComplete} />
        )}

        {/* Result */}
        {completedClip && (
          <ClipResultCard clip={completedClip} onCreateAnother={handleCreateAnother} />
        )}

        {/* History divider */}
        {hasHistory && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              History
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>
        )}

        {/* History or empty */}
        {hasHistory
          ? <ClipHistoryList />
          : (!activeClip && !completedClip && <EmptyState />)
        }

      </div>
    </main>
  );
}
