// =============================================================
//  components/shared/logo.tsx — Marca "Señal"
//  Tres tarjetas que avanzan de columna: la de en medio va adelantada,
//  como un cambio que acaba de llegar a todo el equipo.
// =============================================================

export function Logo({ size = 28, withName = true, className = '' }: { size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="6" fill="#FFC931" />
        <rect x="7" y="8" width="11" height="4" rx="1" fill="#16181D" />
        <rect x="13" y="14" width="12" height="4" rx="1" fill="#16181D" />
        <rect x="7" y="20" width="9" height="4" rx="1" fill="#16181D" opacity="0.45" />
      </svg>
      {withName && (
        <span className="font-wide whitespace-nowrap text-[15px] font-bold uppercase tracking-[0.04em]">
          TaskFlow<span className="text-primary"> Pro</span>
        </span>
      )}
    </span>
  )
}
