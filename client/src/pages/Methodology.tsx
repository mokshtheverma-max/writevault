import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────────────────────

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-4">{children}</div>
    </section>
  )
}

function Layer({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="pl-5 border-l-2 border-indigo-200 mb-5">
      <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-1">Layer {n}</p>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Methodology() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-gray-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" />
          WriteVault
        </button>
        <a
          href="/verify/teacher"
          className="text-sm text-indigo-600 hover:underline"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Verify a Session →
        </a>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Title block */}
        <div className="mb-12">
          <p
            className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            WriteVault — Verification Methodology
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">How WriteVault Works</h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            A plain-English explanation of our verification methodology for educators and administrators.
          </p>
          <p className="text-sm text-gray-400 mt-4" style={{ fontFamily: 'system-ui, sans-serif' }}>Last updated: 2025</p>
          <div className="h-px bg-gray-200 mt-6" />
        </div>

        {/* 1 */}
        <Section title="1. The Problem We Solve">
          <p>
            AI writing detection tools have a well-documented accuracy problem. A 2023 Stanford study found
            that AI detectors produce false positives on more than 20% of essays written by non-native
            English speakers — and that rate climbs further for certain writing styles and topics.
          </p>
          <p>
            When a student is flagged as having submitted AI-generated work, they face a deeply asymmetric
            situation: the accusation carries institutional weight, but the student has no objective record
            of their actual writing process. Their only defense is "I wrote it myself" — which is both
            true and unprovable.
          </p>
          <p>
            WriteVault was built to close this gap. We give students a way to prove their writing process
            before they ever need it — so that if an accusation arises, they have objective evidence on
            their side.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Our Approach — Process, Not Product">
          <p>
            Most AI detection tools analyze <em>what</em> was written — looking at word choice, sentence
            structure, and stylistic patterns to guess whether a human or AI produced the text.
          </p>
          <p>
            WriteVault analyzes <em>how</em> it was written.
          </p>
          <p>
            When a human writes, they think, pause, backtrack, change their mind, speed up when inspired,
            and slow down when stuck. This behavioral signature is extraordinarily difficult to fake —
            it requires not just producing correct text, but producing it in exactly the right way,
            at the right speed, with the right hesitations.
          </p>
          <p>
            WriteVault's editor silently records this entire process with millisecond precision,
            creating a behavioral fingerprint of the writing session. Every pause, keystroke, deletion,
            and revision is captured — and this record is what educators see when they verify a session.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. The 5 Analysis Layers">
          <p style={{ fontFamily: 'system-ui, sans-serif' }} className="text-sm text-gray-500 mb-6">
            Each writing session is analyzed across five independent behavioral dimensions. Scores
            from each layer are combined into a single Behavioral Authenticity Score (0–100).
          </p>

          <Layer n={1} title="Temporal Analysis">
            We measure the time between every keystroke. Human typists are naturally irregular — they
            speed up when in flow, slow down when thinking, and pause completely when formulating an idea.
            We look for this natural irregularity. Suspiciously consistent inter-keystroke timing, or
            typing speeds exceeding typical human maximums, are flagged.
          </Layer>

          <Layer n={2} title="Revision Behavior">
            Real writers make mistakes and fix them. We track every deletion, correction, and revision
            made during the session. An essay with very few corrections — or corrections that appear in
            an unusual distribution — is statistically unusual for authentic human writing. Heavy, natural
            editing is one of the strongest indicators of genuine composition.
          </Layer>

          <Layer n={3} title="Cognitive Signals">
            Humans pause before difficult words, at the start of new paragraphs, and when shifting
            between ideas. We detect these "thinking pauses" — gaps in typing that exceed a threshold
            consistent with cognitive processing — that occur throughout genuine writing. A session
            with no significant pauses across thousands of keystrokes is a notable anomaly.
          </Layer>

          <Layer n={4} title="Biometric Patterns">
            Every person has a unique typing rhythm — how long they hold each key, how quickly they
            transition between specific letter pairs, and how their speed fluctuates over time.
            These micro-timing patterns are as individual as a signature, and they emerge naturally
            over the course of a session. This layer measures consistency with typical human biometric
            profiles.
          </Layer>

          <Layer n={5} title="Linguistic Profile">
            We analyze writing style patterns — sentence length variation, vocabulary diversity,
            punctuation habits, and paragraph structure — and compare them to what is typical for
            human writers in similar contexts. This layer also informs our Writing DNA system,
            which builds a baseline fingerprint across multiple sessions.
          </Layer>
        </Section>

        {/* 4 */}
        <Section title="4. Writing DNA — Multi-Session Verification">
          <p>
            A single session provides behavioral evidence. Multiple sessions provide proof of identity.
          </p>
          <p>
            After three or more sessions, WriteVault constructs a "Writing DNA" profile — a biometric
            baseline of the student's unique typing rhythm, revision habits, and linguistic style.
            Each new session is compared against this baseline, producing a DNA Match Score.
          </p>
          <p>
            A high DNA match means this session looks like the same person who wrote all their previous
            sessions. A low match is a notable signal — though it can also reflect genuine changes in
            writing context (e.g., writing in a second language, or a very different topic).
          </p>
          <p>
            The more sessions a student has completed, the more meaningful the DNA comparison becomes.
            Educators are encouraged to interpret DNA results in context, not in isolation.
          </p>
        </Section>

        {/* 5 */}
        <Section title="5. Cryptographic Verification">
          <p>
            Every WriteVault session is protected by a SHA-256 cryptographic hash — a 64-character
            fingerprint computed from the session's raw keystroke events, document content, and timing.
          </p>
          <p>
            Think of it like a wax seal on an envelope. The hash is computed at the moment the session
            is submitted to WriteVault's servers. If anyone — including the student — attempts to modify
            any part of the session data afterward (even a single character), the hash they can compute
            will no longer match the hash on record.
          </p>
          <p>
            When a teacher uses the Educator Verification Portal, they retrieve the session data directly
            from WriteVault's servers. The hash is recomputed server-side and compared to the stored
            value. This means the session the teacher sees is guaranteed to be identical to what was
            submitted — students have no mechanism to alter it.
          </p>
        </Section>

        {/* 6 */}
        <Section title="6. What We Don't Claim">
          <p>
            We believe transparency about limitations builds more institutional trust than overclaiming.
            WriteVault makes the following honest disclaimers in every educator report:
          </p>
          <ul className="space-y-2 mt-2 ml-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {[
              "WriteVault cannot prove the student was not reading from another screen",
              "WriteVault cannot verify the student's identity through biometric ID",
              "WriteVault cannot detect verbal assistance received during the session",
              "A high score is evidence of authentic process, not proof of authorship",
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-400 shrink-0 font-bold mt-0.5">✗</span>
                {item}
              </li>
            ))}
          </ul>
          <p>
            We designed these limitations to be prominent in the educator-facing report — not buried
            in fine print. Our view is that an honest tool used correctly is far more valuable than an
            overconfident one that erodes trust when its limits are discovered.
          </p>
        </Section>

        {/* 7 */}
        <Section title="7. Recommended Use">
          <p>
            WriteVault works best as one input among several. We recommend educators use WriteVault
            session reports alongside:
          </p>
          <ul className="space-y-2 mt-2 ml-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {[
              "Their own knowledge of the student's voice, vocabulary, and writing ability",
              "In-class writing samples for direct comparison",
              "A conversation with the student about their research and drafting process",
              "Other contextual information about the assignment and submission context",
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-400 shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p>
            A strong WriteVault report alongside consistent in-class writing and a coherent discussion
            of the work is a compelling case for authenticity. A WriteVault report alone should not be
            the sole basis for any academic integrity decision — in either direction.
          </p>
        </Section>

        {/* 8 */}
        <Section title="8. For Administrators">
          <p>
            WriteVault is currently available as a self-service tool for individual students. Institutional
            features — including bulk session verification, LMS integration, and institution-wide reporting
            — are in development.
          </p>
          <p>
            If you are an administrator interested in piloting WriteVault at your institution, or if you
            have questions about our methodology, data practices, or verification process, please contact
            us at{' '}
            <a href="mailto:educator@writevault.app" className="text-indigo-600 hover:underline">
              educator@writevault.app
            </a>.
          </p>
          <p style={{ fontFamily: 'system-ui, sans-serif' }} className="text-sm text-gray-500 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            Institution-level plans with dedicated support, bulk verification APIs, and custom
            reporting are coming soon. Join our educator waitlist at educator@writevault.app.
          </p>
        </Section>

        {/* Footer */}
        <footer
          className="border-t border-gray-200 pt-8 text-xs text-gray-400 space-y-2"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <p>WriteVault — Protecting student integrity in the age of AI</p>
          <p>
            <a href="/verify/teacher" className="text-indigo-500 hover:underline">Verify a Session</a>
            {' · '}
            <a href="/" className="text-indigo-500 hover:underline">Home</a>
            {' · '}
            <a href="mailto:educator@writevault.app" className="text-indigo-500 hover:underline">educator@writevault.app</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
