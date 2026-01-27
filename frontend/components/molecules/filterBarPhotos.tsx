"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PhotoSortBy = "recent" | "oldest"

interface PhotographerOption {
  id: number
  name: string
}

interface FilterBarPhotosProps {
  photographers: PhotographerOption[]
  tags: string[]

  selectedPhotographer: string
  onSelectedPhotographerChange: (value: string) => void

  selectedTag: string
  onSelectedTagChange: (value: string) => void

  sortBy: PhotoSortBy
  onSortByChange: (value: PhotoSortBy) => void
}

export function FilterBarPhotos({
  photographers,
  tags,
  selectedPhotographer,
  onSelectedPhotographerChange,
  selectedTag,
  onSelectedTagChange,
  sortBy,
  onSortByChange,
}: FilterBarPhotosProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-md md:flex-row md:items-end">
      {/* Fotógrafo */}
      {/* <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          Fotógrafo
        </label>
        <Select
          value={selectedPhotographer}
          onValueChange={(value) => {
            console.log("[FilterBarPhotos] onSelectedPhotographerChange:", value)
            onSelectedPhotographerChange(value)
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {photographers.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div> */}

      {/* Tag */}
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          Tag
        </label>
        <Select value={selectedTag} onValueChange={onSelectedTagChange}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orden */}
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          Orden
        </label>
        <Select
          value={sortBy}
          onValueChange={(v) => onSortByChange(v as PhotoSortBy)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="oldest">Más antiguas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
