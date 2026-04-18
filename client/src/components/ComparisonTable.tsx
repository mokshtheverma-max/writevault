import { Check, X } from 'lucide-react'

interface Row {
  label: string
  turnitin: string | { icon: 'check' | 'x'; text?: string }
  gptzero: string | { icon: 'check' | 'x'; text?: string }
  originality: string | { icon: 'check' | 'x'; text?: string }
  writevault: { icon: 'check' | 'x'; text?: string } | string
}

const ROWS: Row[] = [
  {
    label: 'What it does',
    turnitin: 'Detects AI patterns in text',
    gptzero: 'Scores text for AI likelihood',
    originality: 'Content authenticity score',
    writevault: 'Records your writing process',
  },
  {
    label: 'False positive risk',
    turnitin: 'High (flags non-native speakers)',
    gptzero: 'Moderate',
    originality: 'Moderate to High',
    writevault: { icon: 'check', text: 'None — proves your process' },
  },
  {
    label: 'What it proves',
    turnitin: 'Nothing about innocence',
    gptzero: 'Nothing about innocence',
    originality: 'Nothing about innocence',
    writevault: { icon: 'check', text: 'You wrote it yourself' },
  },
  {
    label: 'Good for students?',
    turnitin: { icon: 'x', text: 'Built for schools to catch cheaters' },
    gptzero: { icon: 'x', text: 'Built to detect, not defend' },
    originality: { icon: 'x', text: 'Built for publishers' },
    writevault: { icon: 'check', text: 'Built for students to prove innocence' },
  },
  {
    label: 'Works after accusation?',
    turnitin: { icon: 'x' },
    gptzero: { icon: 'x' },
    originality: { icon: 'x' },
    writevault: { icon: 'check', text: 'Generate proof anytime' },
  },
  {
    label: 'Free to start?',
    turnitin: { icon: 'x', text: '(schools pay)' },
    gptzero: 'Partial',
    originality: { icon: 'x' },
    writevault: { icon: 'check', text: 'Free forever plan' },
  },
]

function Cell({ value, highlight = false }: { value: Row['turnitin']; highlight?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className={`text-sm leading-relaxed ${highlight ? 'text-white' : 'text-text-secondary'}`}>
        {value}
      </span>
    )
  }
  const { icon, text } = value
  const isCheck = icon === 'check'
  return (
    <div className="flex items-start gap-2">
      {isCheck ? (
        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={3} />
      ) : (
        <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={3} />
      )}
      {text && (
        <span className={`text-sm leading-relaxed ${highlight ? 'text-white' : 'text-text-secondary'}`}>
          {text}
        </span>
      )}
    </div>
  )
}

export default function ComparisonTable() {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[720px] px-4 sm:px-0">
        {/* Header */}
        <div
          className="grid rounded-t-2xl border border-b-0 border-border overflow-hidden"
          style={{
            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.1fr',
            background: '#0c0c14',
          }}
        >
          <div className="px-4 sm:px-5 py-4 text-xs uppercase tracking-wider font-semibold text-text-muted">
            Feature
          </div>
          <div className="px-4 sm:px-5 py-4 text-center font-semibold text-text-primary text-sm">
            Turnitin
          </div>
          <div className="px-4 sm:px-5 py-4 text-center font-semibold text-text-primary text-sm">
            GPTZero
          </div>
          <div className="px-4 sm:px-5 py-4 text-center font-semibold text-text-primary text-sm">
            Originality.ai
          </div>
          <div
            className="px-4 sm:px-5 py-4 text-center font-bold text-sm relative"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))',
              color: '#c7d2fe',
            }}
          >
            WriteVault
          </div>
        </div>

        {/* Rows */}
        <div className="border border-t-0 border-border rounded-b-2xl overflow-hidden">
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className="grid border-t border-border first:border-t-0"
              style={{
                gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.1fr',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              }}
            >
              <div className="px-4 sm:px-5 py-4 font-medium text-text-primary text-sm border-r border-border">
                {row.label}
              </div>
              <div className="px-4 sm:px-5 py-4 border-r border-border">
                <Cell value={row.turnitin} />
              </div>
              <div className="px-4 sm:px-5 py-4 border-r border-border">
                <Cell value={row.gptzero} />
              </div>
              <div className="px-4 sm:px-5 py-4 border-r border-border">
                <Cell value={row.originality} />
              </div>
              <div
                className="px-4 sm:px-5 py-4"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  boxShadow: 'inset 2px 0 0 rgba(99,102,241,0.5), inset -2px 0 0 rgba(99,102,241,0.5)',
                }}
              >
                <Cell value={row.writevault} highlight />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
