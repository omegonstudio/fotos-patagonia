"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface IconButtonProps {
  icon: LucideIcon
  onClick?: () => void
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  ariaLabel: string
}

export function IconButton({
  icon: Icon,
  onClick,
  variant = "ghost",
  size = "icon",
  className = "",
  ariaLabel,
}: IconButtonProps) {
  return (
    <Button variant={variant} size={size} onClick={onClick} className={className} aria-label={ariaLabel}>
      <Icon className="w-5 h-5" />
    </Button>
  )
}
