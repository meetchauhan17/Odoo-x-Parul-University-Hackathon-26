const pulse = {
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
};

const styleTag = `
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.8; }
  }
`;

function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`bg-gray-800 rounded ${className}`}
      style={pulse}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <>
      <style>{styleTag}</style>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 px-6 py-3 border-b border-gray-800">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={i} className="h-3 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-6 py-4 border-b border-gray-800/50 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock
                key={c}
                className={`h-4 ${c === 0 ? 'w-8' : 'flex-1'}`}
                style={{ animationDelay: `${(r * cols + c) * 60}ms`, ...pulse }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <>
      <style>{styleTag}</style>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4"
            style={{ animationDelay: `${i * 100}ms` }}>
            <SkeletonBlock className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-6 w-16" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function FormSkeleton({ fields = 4 }) {
  return (
    <>
      <style>{styleTag}</style>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5" style={{ animationDelay: `${i * 80}ms` }}>
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </>
  );
}

export default { TableSkeleton, CardSkeleton, FormSkeleton };
