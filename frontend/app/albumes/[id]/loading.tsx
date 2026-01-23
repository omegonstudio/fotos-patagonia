export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 h-10 w-32 animate-pulse rounded-xl bg-secondary" />

        <div className="mb-8 rounded-2xl bg-card p-6 shadow-md md:p-8">
          <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-secondary" />
          <div className="flex gap-4">
            <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
          </div>
        </div>

        <div className="grid-photo-select">
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  )
}
