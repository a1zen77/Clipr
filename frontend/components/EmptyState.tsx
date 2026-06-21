export function EmptyState() {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="text-5xl">🎬</div>
      <h2 className="text-lg font-semibold text-gray-700">
        No clips yet
      </h2>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">
        Paste an X/Twitter post URL above, set your start and end
        timestamps, and hit Create Clip.
      </p>
    </div>
  );
}
