"use client";

import { useState } from "react";
import { ClipForm } from "@/components/ClipForm";
import { ClipProgress } from "@/components/ClipProgress";
import { ClipResultCard } from "@/components/ClipResultCard";
import { type Clip } from "@/lib/api";

export default function Home() {
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [completedClip, setCompletedClip] = useState<Clip | null>(null);

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
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Social Video Clipper 🎬
          </h1>
          <p className="text-gray-500">
            Paste a URL. Pick your timestamps. Get your clip.
          </p>
        </div>

        {/* Form — hidden while processing or done */}
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

      </div>
    </main>
  );
}
