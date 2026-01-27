"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SortBy = "recent" | "oldest" | "name"

interface PhotographerOption {
  id: number
  name: string
}

interface FilterBarAlbumProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void

  selectedPhotographer: string // "all" o id como string
  onSelectedPhotographerChange: (value: string) => void
  photographers: PhotographerOption[]

  selectedTag: string // "all" o tag
  onSelectedTagChange: (value: string) => void
  allTags: string[]

  sortBy: SortBy
  onSortByChange: (value: SortBy) => void
}

export function FilterBarAlbum({
  searchQuery,
  onSearchQueryChange,
  selectedPhotographer,
  onSelectedPhotographerChange,
  photographers,
  selectedTag,
  onSelectedTagChange,
  allTags,
  sortBy,
  onSortByChange,
}: FilterBarAlbumProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar álbumes, eventos o lugares..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-10 rounded-xl border-gray-200"
        />
      </div>

      {/* Selects */}
      <div className="flex gap-3 flex-wrap">
        {/* Fotógrafo */}
        <Select
          value={selectedPhotographer}
          onValueChange={onSelectedPhotographerChange}
        >
          <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
            <SelectValue placeholder="Fotógrafo" />
          </SelectTrigger>
          <SelectContent className="bg-[#f2f2e4]">
            <SelectItem value="all">Todos los fotógrafos</SelectItem>
            {photographers.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags */}
        <Select value={selectedTag} onValueChange={onSelectedTagChange}>
          <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent className="bg-[#f2f2e4]">
            <SelectItem value="all">Todos los tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Orden */}
        <Select
          value={sortBy}
          onValueChange={(v) => onSortByChange(v as SortBy)}
        >
          <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent className="bg-[#f2f2e4]">
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="oldest">Más antiguos</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
