"use client"

import { forwardRef } from "react"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

type IconButtonProps = {
  icon: LucideIcon
  ariaLabel: string
  iconProps?: React.ComponentProps<LucideIcon>
} & React.ComponentPropsWithoutRef<typeof Button>


export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      ariaLabel,
      iconProps,
      variant = "ghost",
      size = "icon",
      className = "",
      asChild,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        aria-label={ariaLabel}
        asChild={asChild}
        {...props}
      >
        <Icon className="h-5 w-5" {...iconProps} />
      </Button>
    )
  },
)

IconButton.displayName = "IconButton"