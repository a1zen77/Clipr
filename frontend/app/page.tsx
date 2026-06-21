"use client";

import { useState } from "react";
import { ClipForm } from "@/components/ClipForm";
import { type Clip } from "@/lib/api";

export default function Home() {
  const [activeClip, setActiveClip] = useState<Clip | null>(null);

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
        <ClipForm onClipCreated={(clip) => setActiveClip(clip)} />

        {/* Placeholder — replaced in Step 3 */}
        {activeClip && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm text-blue-700">
              ✅ Clip submitted! ID: <span className="font-mono">{activeClip.id}</span>
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Status: {activeClip.job?.status} — Progress tracker coming in Step 3.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
