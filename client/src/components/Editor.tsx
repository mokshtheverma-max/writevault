import { useState, useRef } from 'react';
import { computeAuthenticityScore } from '../engine/scorer';
import type { AuthenticityReport, KeystrokeEvent } from '../engine/types';

interface EditorProps {
  onFinish: (report: AuthenticityReport) => void;
}

const MIN_WORDS = 30;

export function Editor({ onFinish }: EditorProps) {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const eventsRef = useRef<KeystrokeEvent[]>([]);
  const sessionIdRef = useRef(`session_${Date.now().toString(36)}`);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canFinish = wordCount >= MIN_WORDS && !isAnalyzing;
  const wordsRemaining = Math.max(0, MIN_WORDS - wordCount);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.target as HTMLTextAreaElement;
    eventsRef.current.push({
      type: 'keydown',
      key: e.key,
      timestamp: Date.now(),
      position: ta.selectionStart !== null ? ta.selectionStart : undefined,
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.target as HTMLTextAreaElement;
    eventsRef.current.push({
      type: 'keyup',
      key: e.key,
      timestamp: Date.now(),
      position: ta.selectionStart !== null ? ta.selectionStart : undefined,
    });
  };

  const handleFinish = async () => {
    if (!canFinish) return;
    setIsAnalyzing(true);
    try {
      const report = await computeAuthenticityScore(
        eventsRef.current,
        content,
        sessionIdRef.current,
      );
      localStorage.setItem('wv_last_report', JSON.stringify(report));
      onFinish(report);
    } catch (err) {
      console.error('Authenticity analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex flex-col font-sans">

      {/* Header */}
      <header className="flex items-center justify-between px-10 py-4 border-b border-vault-border">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white">WriteVault</span>
          <span className="text-xs text-vault-muted bg-vault-card px-2 py-0.5 rounded-full border border-vault-border">
            Authenticity Engine v1
          </span>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-sm text-vault-muted tabular-nums">
            {wordCount} words · {content.length} chars
          </span>

          <button
            onClick={() => { void handleFinish(); }}
            disabled={!canFinish}
            className={[
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              canFinish
                ? 'bg-vault-purple text-white hover:bg-vault-purple-light cursor-pointer'
                : 'bg-vault-card text-vault-muted cursor-not-allowed border border-vault-border',
            ].join(' ')}
          >
            {isAnalyzing
              ? 'Analyzing…'
              : wordsRemaining > 0
                ? `${wordsRemaining} more words`
                : 'Analyze Writing'}
          </button>
        </div>
      </header>

      {/* Editor surface */}
      <main className="flex-1 px-10 py-8 max-w-3xl mx-auto w-full box-border">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Begin writing here. Every keystroke is recorded to verify authentic human authorship…"
          spellCheck
          autoFocus
          className="w-full min-h-[65vh] bg-transparent border-none outline-none text-vault-text text-lg leading-relaxed resize-none font-serif placeholder-vault-muted/40 caret-vault-purple"
        />
      </main>

      {/* Status bar */}
      <footer className="flex items-center gap-6 px-10 py-3 border-t border-vault-border text-xs text-vault-muted/60">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-vault-green animate-pulse-slow" />
          Biometric recording active
        </span>
        <span>Session: {sessionIdRef.current}</span>
        <span className="ml-auto">
          {isAnalyzing && (
            <span className="text-vault-purple animate-pulse">Running 5-layer analysis…</span>
          )}
        </span>
      </footer>
    </div>
  );
}
