"use client";

import { useQuery } from "@tanstack/react-query";
import { listClips } from "@/lib/api";

export function Navbar() {
  const { data } = useQuery({
    queryKey: ["clips"],
    queryFn: () => listClips(0, 20),
  });

  const total = data?.total ?? 0;
  const done  = data?.clips.filter((c) => c.job?.status === "done").length ?? 0;

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(14,15,17,0.85)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 672,
        margin: "0 auto",
        padding: "0 1rem",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}>✂</span>
          <span style={{
            fontWeight: 600,
            fontSize: 15,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}>
            Clipper
          </span>
        </div>

        {total > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "var(--text-muted)",
          }}>
            <span>{total} clip{total !== 1 ? "s" : ""}</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{ color: "var(--success)", fontWeight: 500 }}>
              {done} ready
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
