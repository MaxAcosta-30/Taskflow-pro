// =============================================================
//  components/shared/avatar.tsx
//  Avatar con iniciales de respaldo: si no hay imagen o no carga, nunca queda un ícono roto.
// =============================================================

'use client'

import Image from 'next/image'
import { useState } from 'react'

export function Avatar({ name, src, size = 28, className = '' }: { name: string; src?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return (
    <span
      title={name}
      className={`relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100 ${className}`}
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        <Image src={src} alt="" fill unoptimized sizes={`${size}px`} className="object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="font-semibold" style={{ fontSize: Math.max(9, size * 0.38) }} aria-hidden="true">
          {initials}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  )
}
