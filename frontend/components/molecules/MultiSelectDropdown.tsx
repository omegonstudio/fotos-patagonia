"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MultiSelectDropdownProps<T> {
  items: T[]
  loading?: boolean
  getKey: (item: T) => number | string
  getLabel: (item: T) => string
  onSelect: (id: number) => void
  placeholder?: string
  disabled?: boolean
}

export function MultiSelectDropdown<T>({
  items,
  loading,
  getKey,
  getLabel,
  onSelect,
  placeholder = "Seleccionar",
  disabled,
}: MultiSelectDropdownProps<T>) {
  return (
    <Select
      onValueChange={(value) => onSelect(Number(value))}
      disabled={loading || disabled}
    >
      <SelectTrigger className="mt-1 w-full rounded-lg border-gray-200 bg-white">
        <SelectValue
          placeholder={loading ? "Cargando..." : placeholder}
        />
      </SelectTrigger>

      <SelectContent className="bg-white">
        {items.map((item) => {
          const value = String(getKey(item))
          return (
            <SelectItem key={value} value={value}>
              {getLabel(item)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
