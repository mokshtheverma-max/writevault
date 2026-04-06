import type { AuthenticityReport, LayerScore } from '../engine/types';

interface DashboardProps {
  report: AuthenticityReport;
  onReset: () => void;
}

interface ScoreBarProps {
  label: string;
  weight: number;
  layer: LayerScore;
}

function ScoreBar({ label, weight, layer }: ScoreBarProps) {
  const { score, confidence } = layer;
  const colorClass =
    score > 70
      ? 'bg-vault-green'
      : score > 45
        ? 'bg-vault-yellow'
        : 'bg-vault-red';
  const textColorClass =
    score > 70
      ? 'text-vault-green'
      : score > 45
        ? 'text-vault-yellow'
        : 'text-vault-red';

  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-vault-text">{label}</span>
          <span className="text-xs text-vault-muted/60">
            ×{(weight * 100).toFixed(0)}%
          </span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${textColorClass}`}>
          {score.toFixed(1)}
        </span>
      </div>

      {/* Track */}
      <div className="h-2 bg-vault-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${score}%`, opacity: 0.3 + confidence * 0.7 }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-vault-muted/50">
          {layer.flags.length > 0 && (
            <span className="text-vault-red/70">
              {layer.flags.length} flag{layer.flags.length > 1 ? 's' : ''}
            </span>
          )}
        </span>
        <span className="text-xs text-vault-muted/50 tabular-nums">
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
    </div>
  );
}

export function Dashboard({ report, onReset }: DashboardProps) {
  const { compositeScore, verdict, confidence, flags, layers, weights, proofId, sessionHash, sessionId, timestamp } = report;

  const scoreColor =
    compositeScore > 70
      ? 'text-vault-green'
      : compositeScore > 45
        ? 'text-vault-yellow'
        : 'text-vault-red';

  const verdictBg =
    compositeScore > 70
      ? 'bg-vault-green/10 border-vault-green/30'
      : compositeScore > 45
        ? 'bg-vault-yellow/10 border-vault-yellow/30'
        : 'bg-vault-red/10 border-vault-red/30';

  const layerDefs: Array<{ key: keyof typeof layers; label: string }> = [
    { key: 'temporal',   label: 'Temporal Analysis'     },
    { key: 'revision',   label: 'Revision Patterns'     },
    { key: 'cognitive',  label: 'Cognitive Load'         },
    { key: 'biometric',  label: 'Biometric Signature'   },
    { key: 'linguistic', label: 'Linguistic Fingerprint' },
  ];

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text font-sans">

      {/* Header */}
      <header className="flex items-center justify-between px-10 py-4 border-b border-vault-border">
        <span className="text-xl font-bold tracking-tight text-white">
          WriteVault
          <span className="ml-2 text-sm font-normal text-vault-muted">Authenticity Report</span>
        </span>
        <button
          onClick={onReset}
          className="px-4 py-1.5 text-sm text-vault-muted border border-vault-border rounded-lg hover:border-vault-purple hover:text-white transition-all duration-200"
        >
          ← New Session
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-10 py-10 animate-slide-up">

        {/* Score hero */}
        <div className="text-center mb-10">
          <div className={`text-8xl font-black tabular-nums leading-none mb-2 ${scoreColor}`}>
            {compositeScore.toFixed(1)}
          </div>
          <div className="text-vault-muted/60 text-sm mb-5">out of 100</div>

          <div className={`inline-block px-5 py-3 rounded-xl border text-sm font-medium ${verdictBg}`}>
            {verdict}
          </div>

          <div className="mt-4 text-xs text-vault-muted/50">
            Overall confidence: {(confidence * 100).toFixed(0)}% ·{' '}
            {new Date(timestamp).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Layer scores — wider column */}
          <div className="lg:col-span-3 bg-vault-surface border border-vault-border rounded-2xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-muted mb-6">
              5-Layer Analysis
            </h2>
            {layerDefs.map(({ key, label }) => (
              <ScoreBar
                key={key}
                label={label}
                weight={weights[key]}
                layer={layers[key]}
              />
            ))}
          </div>

          {/* Right column: flags + proof */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Detected signals */}
            <div className="bg-vault-surface border border-vault-border rounded-2xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-muted mb-4">
                Detected Signals
              </h2>
              {flags.length === 0 ? (
                <p className="text-sm text-vault-green/80">No red flags detected.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {flags.map((flag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-vault-red/10 border border-vault-red/30 text-vault-red text-xs rounded-md"
                    >
                      {flag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cryptographic proof */}
            <div className="bg-vault-surface border border-vault-border rounded-2xl p-6 flex-1">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-muted mb-4">
                Cryptographic Proof
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-vault-muted/60 block mb-0.5">Proof ID</span>
                  <code className="font-mono text-vault-green text-sm">{proofId}</code>
                </div>
                <div>
                  <span className="text-vault-muted/60 block mb-0.5">Session ID</span>
                  <code className="font-mono text-vault-muted">{sessionId}</code>
                </div>
                <div>
                  <span className="text-vault-muted/60 block mb-0.5">SHA-256 Hash</span>
                  <code className="font-mono text-vault-muted/60 break-all leading-relaxed">
                    {sessionHash}
                  </code>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Weight breakdown */}
        <div className="mt-6 bg-vault-surface border border-vault-border rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-muted mb-4">
            Scoring Weights
          </h2>
          <div className="flex gap-3 flex-wrap">
            {layerDefs.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-2 bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-xs"
              >
                <span className="text-vault-muted">{label}</span>
                <span className="text-vault-purple-light font-semibold">
                  {(weights[key] * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
