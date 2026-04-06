interface LoadingSpinnerProps {
  size?: number
  color?: string
  label?: string
}

export default function LoadingSpinner({
  size = 24,
  color = '#7c3aed',
  label,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2.5"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2 A10 10 0 0 1 22 12"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span className="text-sm text-text-muted animate-pulse">{label}</span>
      )}
    </div>
  )
}
