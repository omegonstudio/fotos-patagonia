export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-2 h-12 w-64 animate-pulse rounded bg-secondary" />
          <div className="h-6 w-96 animate-pulse rounded bg-secondary" />
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-secondary" />
          <div className="flex gap-3">
            <div className="h-10 w-[180px] animate-pulse rounded-xl bg-secondary" />
            <div className="h-10 w-[180px] animate-pulse rounded-xl bg-secondary" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-md">
              <div className="aspect-square animate-pulse bg-secondary" />
              <div className="p-4">
                <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-secondary" />
                <div className="h-4 w-full animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
