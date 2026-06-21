"use client";

import { useState } from "react";
import { ClipForm } from "@/components/ClipForm";
import { ClipProgress } from "@/components/ClipProgress";
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

        {/* Form */}
        <ClipForm onClipCreated={handleClipCreated} />

        {/* Progress tracker */}
        {activeClip && !completedClip && (
          <ClipProgress
            clipId={activeClip.id}
            onComplete={handleComplete}
          />
        )}

        {/* Placeholder — replaced in Step 4 */}
        {completedClip && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm text-green-700 font-medium">
              ✅ Clip ready! Result card coming in Step 4.
            </p>
            <p className="text-sm text-green-600 font-mono mt-1">
              {completedClip.id}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
