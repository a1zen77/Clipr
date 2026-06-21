export function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "3rem 0" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, margin: "0 auto 1rem",
      }}>
        ✂
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
        No clips yet
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 260, margin: "0 auto", lineHeight: 1.6 }}>
        Paste an X/Twitter URL above, set your timestamps, and hit Create clip.
      </p>
    </div>
  );
}
