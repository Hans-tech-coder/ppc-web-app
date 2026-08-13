"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export function AnimatedNumber({ 
  value, 
  prefix = "", 
  className 
}: { 
  value: number | string; 
  prefix?: string; 
  className?: string 
}) {
  const groupRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    group.classList.remove("is-animating")
    void group.offsetHeight
    group.classList.add("is-animating")
  }, [value, prefix])

  const str = `${prefix}${value}`
  const chars = str.split("")

  return (
    <span ref={groupRef} className={cn("t-digit-group is-animating", className)}>
      {chars.map((ch, i) => (
        <span 
          key={`${i}-${ch}`} 
          className="t-digit"
          data-stagger={i === chars.length - 2 ? "1" : i === chars.length - 1 ? "2" : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}
