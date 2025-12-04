/**
 * Skeleton loading components for better UX
 */

// Basic skeleton block
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

// Skeleton for text lines
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// Skeleton for process table row
export function SkeletonProcessRow() {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

// Skeleton for stats card
export function SkeletonStatsCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Skeleton for process detail page
export function SkeletonProcessDetail() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for chart
export function SkeletonChart() {
  return (
    <div className="h-64 md:h-80 flex flex-col">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
      <div className="flex-1 flex items-end gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
