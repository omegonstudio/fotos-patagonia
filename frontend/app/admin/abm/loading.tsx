import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-gray-200">
            <div className="space-y-4 p-6">
              <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
