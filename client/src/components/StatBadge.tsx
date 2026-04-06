interface StatBadgeProps {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

export default function StatBadge({
  label,
  value,
  sub,
  highlight,
}: StatBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl p-4 gap-1 ${
        highlight
          ? 'bg-primary/10 border border-primary/25'
          : 'bg-elevated border border-border'
      }`}
    >
      <span className="text-text-muted text-xs uppercase tracking-wider">{label}</span>
      <span className="text-text-primary text-2xl font-bold">{value}</span>
      {sub && <span className="text-text-muted text-xs">{sub}</span>}
    </div>
  )
}
