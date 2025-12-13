export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 h-20 w-20 animate-pulse rounded-full bg-muted" />
        <div className="mx-auto mb-2 h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
