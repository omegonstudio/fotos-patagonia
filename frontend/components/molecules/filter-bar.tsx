"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Calendar, MapPin, Clock, X } from "lucide-react"

interface FilterBarProps {
  onFilterChange?: (filters: { date?: string; place?: string; time?: string }) => void
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [date, setDate] = useState("")
  const [place, setPlace] = useState("")
  const [time, setTime] = useState("")

  const handleSearch = () => {
    onFilterChange?.({
      date: date || undefined,
      place: place || undefined,
      time: time || undefined,
    })
  }

  const handleClear = () => {
    setDate("")
    setPlace("")
    setTime("")
    onFilterChange?.({})
  }

  const handleDateChange = (value: string) => {
    setDate(value)
    onFilterChange?.({ date: value || undefined, place: place || undefined, time: time || undefined })
  }

  const handlePlaceChange = (value: string) => {
    setPlace(value)
    onFilterChange?.({ date: date || undefined, place: value || undefined, time: time || undefined })
  }

  const handleTimeChange = (value: string) => {
    setTime(value)
    onFilterChange?.({ date: date || undefined, place: place || undefined, time: value || undefined })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-md md:flex-row md:items-end">
      <div className="flex-1">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Fecha
        </label>
        <Input
          type="date"
          value={date}
          className="rounded-xl border-gray-200"
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      <div className="flex-1">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="w-4 h-4" />
          Lugar
        </label>
        <Input
          type="text"
          value={place}
          placeholder="Ej: Bariloche"
          className="rounded-xl border-gray-200"
          onChange={(e) => handlePlaceChange(e.target.value)}
        />
      </div>

      <div className="flex-1">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="w-4 h-4" />
          Hora
        </label>
        <Input
          type="time"
          value={time}
          className="rounded-xl border-gray-200"
          onChange={(e) => handleTimeChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSearch}
          className="rounded-xl bg-primary px-6 font-semibold text-foreground hover:bg-primary-hover md:mb-0"
        >
          <Search className="mr-2 w-4 h-4" />
          Buscar
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          className="rounded-xl px-6 font-semibold md:mb-0 bg-transparent"
        >
          <X className="mr-2 w-4 h-4" />
          Limpiar
        </Button>
      </div>
    </div>
  )
}
