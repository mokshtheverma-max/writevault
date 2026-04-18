import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import MobileNav from '../components/MobileNav'
import BackToTop from '../components/BackToTop'
import { usePageTitle } from '../hooks/usePageTitle'

type Article = {
  slug: string
  title: string
  preview: string
  body: ReactNode
}

const articles: Article[] = [
  {
    slug: 'ai-detection-problem',
    title: 'The AI Detection Problem No One Is Talking About',
    preview:
      "AI writing detectors are now standard in schools worldwide. And they have a serious problem: they flag innocent students.",
    body: (
      <>
        <p>
          AI writing detectors are now standard in schools worldwide. And they
          have a serious problem: they flag innocent students. The tools were
          built quickly in response to ChatGPT, marketed aggressively, and
          deployed in classrooms long before their error rates were well
          understood. Students are paying the price.
        </p>

        <h2>How AI detectors actually work</h2>
        <p>
          Most commercial AI detectors rely on two statistical measures:
          perplexity and burstiness. Perplexity is a measure of how
          "predictable" a sequence of words is to a language model — text that
          a model finds unsurprising scores low, and low-perplexity writing
          gets labeled as likely AI. Burstiness measures how much sentence
          length and complexity vary across a document. Human writers tend to
          mix short punchy sentences with longer, winding ones; language
          models, especially earlier ones, often produce output that's more
          uniform.
        </p>
        <p>
          The problem is that these are correlations, not proof. A student
          who writes in a careful, even style — common in formal academic
          writing — produces exactly the kind of low-perplexity, low-burstiness
          text that detectors flag. The detector isn't measuring whether the
          student used AI. It's measuring whether the writing <em>looks like</em> the
          kind of writing models produce. Those are not the same question.
        </p>

        <h2>Why they fail on real students</h2>
        <p>
          OpenAI quietly shut down its own AI classifier in 2023, citing its
          low rate of accuracy. That's a striking admission from the company
          that makes the model everyone is trying to detect. Independent
          researchers have since documented several patterns of failure that
          should concern anyone relying on these tools:
        </p>
        <ul>
          <li>
            <strong>Non-native English speakers get flagged more often.</strong> A
            2023 Stanford study by Liang et al. found that detectors
            misclassified TOEFL essays written by non-native speakers as
            AI-generated at dramatically higher rates than essays by native
            speakers. The likely reason: non-native writers often use a more
            constrained vocabulary and simpler sentence structures, which
            happens to resemble what models produce.
          </li>
          <li>
            <strong>Formal, careful writing gets flagged.</strong> Students who
            plan their essays, avoid slang, and revise heavily end up with
            smoother prose — and smoother prose is exactly what a perplexity
            check penalizes.
          </li>
          <li>
            <strong>Short submissions are unreliable.</strong> Detectors need a
            lot of text to make even a rough guess. On short answers or
            paragraphs, their output is closer to noise than signal.
          </li>
          <li>
            <strong>Paraphrasing breaks them.</strong> Any student who runs
            AI-generated text through a rewording step can usually get a clean
            score. Which means the tool punishes the honest and lets the
            actually-cheating slip through.
          </li>
        </ul>

        <h2>The human cost</h2>
        <p>
          It's easy to talk about false positive rates as a statistic. The
          reality is that behind every false positive is a student sitting in
          an office being told their work isn't theirs. Some lose grades.
          Some fail courses. Some end up in front of academic integrity
          boards, trying to prove a negative — that they <em>didn't</em> use a
          tool — with no evidence either way. The burden of proof, in
          practice, has quietly shifted onto the student.
        </p>
        <p>
          That's the part that bothers me most. In any fair process, the
          accusation needs to come with evidence. A detector score is not
          evidence; it's a probabilistic guess from a tool the vendor itself
          cannot guarantee the accuracy of. But once a teacher sees a red
          number, the conversation starts from a position of suspicion.
        </p>

        <h2>What students can actually do</h2>
        <p>
          The honest answer is: you can't control whether a detector flags
          you. You can only control what evidence you have when it does. Keep
          your drafts. Keep your research notes. If you write in Google Docs,
          its version history is a surprisingly strong defense. And — the
          reason WriteVault exists — consider recording your writing process
          while you work, so that if the accusation ever comes, you have
          something more concrete than "trust me."
        </p>

        <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <p className="text-white font-semibold">
            WriteVault gives you proof you wrote it yourself.
          </p>
          <p className="text-text-secondary text-sm mt-2">
            Every keystroke, every pause, every revision — captured as you
            write, saved with a cryptographic hash you can show anyone.
          </p>
          <CTAButton label="Try WriteVault Free →" />
        </div>
      </>
    ),
  },
  {
    slug: 'accused-of-ai',
    title: 'What To Do If Your Professor Thinks You Used AI',
    preview:
      "A calm, honest step-by-step guide for handling an AI-writing accusation — from the first email to a formal appeal.",
    body: (
      <>
        <p>
          Being accused of using AI to write an essay you actually wrote is
          one of the more disorienting things that can happen in school. The
          instinct is to panic, over-explain, or fire back. Don't. The
          students who come out of these situations well are the ones who
          slow down and treat it like a process. Here's what that process
          looks like.
        </p>

        <h2>Step 1 — Stay calm. Don't panic.</h2>
        <p>
          Your first reaction sets the tone for everything that follows. If
          the first message you send is defensive or angry, you've made the
          conversation about you, not about the evidence. Breathe. Wait a few
          hours before replying if you need to. Remember: an accusation is
          not a conviction, and most universities have formal processes that
          require actual evidence to move forward.
        </p>

        <h2>Step 2 — Ask which tool flagged you and what the score was</h2>
        <p>
          You are entitled to know what the accusation is based on. Ask,
          politely and in writing:
        </p>
        <ul>
          <li>Which detector was used (Turnitin, GPTZero, Copyleaks, etc.)?</li>
          <li>What score did it return?</li>
          <li>Is that score the only reason for the accusation, or are there other concerns (style shift, unfamiliar vocabulary, suspicious sources)?</li>
        </ul>
        <p>
          Getting this in writing matters. It pins down what you're actually
          defending against, and it creates a record if the situation
          escalates. It also sometimes reveals that the "evidence" is just a
          detector score — which, as the first article in this series
          explains, is a probabilistic guess, not proof.
        </p>

        <h2>Step 3 — Know your rights</h2>
        <p>
          Every accredited university has an academic integrity policy, and
          that policy almost always includes an appeal process. Find yours.
          It's usually on the registrar's or dean of students' website. Read
          the whole thing, not just the summary. Pay attention to:
        </p>
        <ul>
          <li>Deadlines for responding or filing an appeal</li>
          <li>Who makes the final decision</li>
          <li>Whether you can bring an advisor or representative</li>
          <li>What standard of evidence applies</li>
        </ul>
        <p>
          You don't have to memorize it. You just need to know where to look
          when something happens.
        </p>

        <h2>Step 4 — Gather evidence of your writing process</h2>
        <p>
          This is where most students lose. They wrote the essay, they know
          they wrote the essay, but they have nothing to show for the hours
          they spent on it. Work with whatever you have:
        </p>
        <ul>
          <li>
            <strong>Google Docs version history.</strong> If you wrote in
            Google Docs, open the document, click File → Version history →
            See version history. You'll see a timeline of every significant
            save. It's not perfect — Docs compresses edits — but it's often
            convincing.
          </li>
          <li>
            <strong>Research notes.</strong> Screenshots of sources,
            highlighted PDFs, browser history, citation manager entries.
            Anything that shows you engaged with the material.
          </li>
          <li>
            <strong>Earlier drafts.</strong> If you emailed yourself a draft,
            sent it to a friend, or shared it with a writing center tutor,
            those timestamps matter.
          </li>
          <li>
            <strong>WriteVault session report.</strong> If you wrote in
            WriteVault, you have a minute-by-minute record of your writing
            process, verified with a cryptographic hash. That's the kind of
            evidence that ends conversations.
          </li>
        </ul>

        <h2>Step 5 — Request a meeting and present your evidence</h2>
        <p>
          Ask for a meeting. In person if you can, video if you can't. Bring
          your evidence organized and ready to show. Lead with facts, not
          feelings: "Here's my version history. Here are the sources I used.
          Here's how long I spent writing each section." Let the evidence do
          the work.
        </p>
        <p>
          If the professor is reasonable — and most are — showing up
          prepared often resolves the situation on the spot. Teachers want
          to be fair. They just need something concrete to point to.
        </p>

        <h2>Step 6 — If needed, escalate</h2>
        <p>
          If the conversation doesn't go anywhere, escalate formally. That
          usually means contacting the department chair, filing an appeal
          under the academic integrity process, or reaching out to your
          school's ombudsperson. Keep everything in writing. Stay polite.
          The goal is not to win an argument — it's to get your evidence
          in front of someone whose job is to evaluate it fairly.
        </p>

        <h2>Going forward</h2>
        <p>
          Whether this particular situation resolves in your favor or not,
          take the lesson: you need to be able to prove your process, not
          just your product. Use WriteVault before submitting any important
          essay so you always have the proof ready before you need it. The
          best time to collect evidence is before anyone asks for it.
        </p>

        <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <p className="text-white font-semibold">
            Generate your proof before you submit.
          </p>
          <p className="text-text-secondary text-sm mt-2">
            Write in WriteVault once. Keep the report. Sleep easier.
          </p>
          <CTAButton label="Open the Editor →" />
        </div>
      </>
    ),
  },
  {
    slug: 'writing-dna',
    title: "How WriteVault's Writing DNA Works",
    preview:
      "When you write, you leave a behavioral fingerprint that's as unique as your actual fingerprint. Here's what we capture, and why it's hard to fake.",
    body: (
      <>
        <p>
          When you write, you leave a behavioral fingerprint that's as unique
          as your actual fingerprint. The words on the page are only the
          surface of it. The real signal is in <em>how</em> you got there — the
          order you typed things in, where you paused, what you deleted, how
          fast your fingers move when you're in flow versus when you're
          stuck. We call the combined record of all of that your Writing DNA,
          and WriteVault is built around capturing it.
        </p>
        <p>
          Here's what that looks like, layer by layer, in plain language.
        </p>

        <h2>Layer 1 — Temporal: your typing rhythm</h2>
        <p>
          Every keystroke is timestamped to the millisecond. From that, we
          can reconstruct your typing rhythm across a whole session — when
          you sped up, when you slowed down, when you stopped entirely. Real
          writing has a shape. There are bursts (when you know exactly what
          you want to say), plateaus (when you're cruising through familiar
          material), and stalls (when you're figuring something out). These
          patterns are very consistent for a given person and very hard to
          reproduce on purpose.
        </p>

        <h2>Layer 2 — Revision: how you edit</h2>
        <p>
          Humans don't write in a straight line. They write a sentence, look
          at it, cut the first half, rewrite the end, go back three
          paragraphs to fix a word. WriteVault records every insertion and
          deletion. The shape of that revision trail is distinctive: some
          people edit heavily as they go, some write a messy first pass and
          clean it up later, some barely revise at all. What's important is
          that <em>something</em> is happening — a document that appears in its
          final form with no revisions is extremely suspicious.
        </p>

        <h2>Layer 3 — Cognitive: your thinking pauses</h2>
        <p>
          Long pauses are where thinking happens. You stop before a hard
          sentence, or between paragraphs, or when you're about to make a
          claim you're not quite sure about. The placement of those pauses
          is cognitive evidence: a human writer pauses at the same
          structural points a reader would notice. AI-generated text, pasted
          in, has no pauses at all. AI-generated text that's been re-typed
          has pauses in the wrong places.
        </p>

        <h2>Layer 4 — Biometric: your key press patterns</h2>
        <p>
          This is the layer closest to a literal fingerprint. The interval
          between when you press a key and when you release it (dwell time),
          and the interval between releasing one key and pressing the next
          (flight time), form a pattern that stays stable for a given
          person. Typing biometrics have been studied for decades as an
          authentication signal. In WriteVault, they're one more layer of
          evidence that the person who sat down to write is the person the
          account belongs to.
        </p>

        <h2>Layer 5 — Linguistic: your writing style</h2>
        <p>
          Finally, the words themselves. Word choice, sentence length
          distribution, punctuation habits, how often you start sentences
          with "And" or "But" even though your English teacher said not to.
          Style is noisier than the other layers — it changes with topic and
          mood — but over time, a consistent style builds up, and a dramatic
          departure from it is worth looking at.
        </p>

        <h2>Why it's hard to fake</h2>
        <p>
          Any one of these layers could, in theory, be gamed. Someone
          determined enough could re-type AI output slowly, insert fake
          pauses, add fake deletions. But to fake <em>all five layers at once</em>,
          consistently, across a whole essay, in a way that also matches
          your own historical patterns — that's a much harder problem than
          just writing the essay yourself. And WriteVault seals each session
          with a SHA-256 hash, so you can't edit the record after the fact
          without it being obvious.
        </p>
        <p>
          The short version: AI doesn't pause to think. AI doesn't backtrack.
          AI doesn't get stuck on a sentence and rewrite it three times. You
          do. WriteVault captures that.
        </p>

        <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <p className="text-white font-semibold">
            Start building your Writing DNA.
          </p>
          <p className="text-text-secondary text-sm mt-2">
            The more you write, the stronger your fingerprint gets.
          </p>
          <CTAButton label="Open the Editor →" />
        </div>
      </>
    ),
  },
]

function CTAButton({ label }: { label: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/editor')}
      className="mt-5 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 inline-block"
      style={{
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        padding: '12px 24px',
        boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 4px 16px rgba(99,102,241,0.25)',
      }}
    >
      {label}
    </button>
  )
}

function BlogNav() {
  const navigate = useNavigate()
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-base/80 backdrop-blur-xl"
      style={{ height: 64 }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="font-bold text-lg tracking-tight text-text-primary">WriteVault</span>
      </button>
      <div className="hidden md:flex items-center gap-6">
        <a href="/methodology" className="text-text-secondary hover:text-text-primary text-sm transition-colors">How It Works</a>
        <a href="/blog" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Blog</a>
        <a href="/pricing" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Pricing</a>
      </div>
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => navigate('/auth')}
          className="text-text-secondary hover:text-text-primary text-sm transition-colors px-3 py-2"
        >
          Sign In
        </button>
        <button
          onClick={() => navigate('/auth?mode=register')}
          className="text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 4px 16px rgba(99,102,241,0.2)',
          }}
        >
          Get Started Free
        </button>
      </div>
      <MobileNav />
    </nav>
  )
}

export default function Blog() {
  usePageTitle('WriteVault — Blog')
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const active = activeSlug ? articles.find(a => a.slug === activeSlug) ?? null : null

  if (active) {
    return (
      <div className="min-h-screen bg-base text-text-primary">
        <BlogNav />
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
          <button
            onClick={() => setActiveSlug(null)}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All articles
          </button>
          <h1
            className="text-white font-bold"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {active.title}
          </h1>
          <p className="text-sm mt-4" style={{ color: '#64748b' }}>
            By Moksh Verma, Founder of WriteVault · April 2026
          </p>
          <div
            className="mt-10 space-y-5 leading-relaxed"
            style={{ color: '#cbd5e1', fontSize: '17px' }}
          >
            {active.body}
          </div>
        </article>
        <BackToTop />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <BlogNav />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#475569' }}>
          BLOG
        </p>
        <h1
          className="text-white font-bold"
          style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Writing, honestly.
        </h1>
        <p className="text-text-secondary mt-5 max-w-xl" style={{ fontSize: '18px', lineHeight: 1.6 }}>
          Writing and research by the WriteVault team. No fake statistics, no
          invented studies — just what we actually know about AI detection and
          how to protect yourself.
        </p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {articles.map(article => (
            <button
              key={article.slug}
              onClick={() => {
                setActiveSlug(article.slug)
                window.scrollTo({ top: 0 })
              }}
              className="text-left bg-surface border border-border rounded-2xl p-6 transition-all hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5 flex flex-col"
            >
              <p className="text-xs" style={{ color: '#64748b' }}>
                By Moksh Verma · April 2026
              </p>
              <h2 className="text-white font-semibold text-xl mt-3 leading-snug">
                {article.title}
              </h2>
              <p className="text-text-secondary text-sm mt-3 leading-relaxed flex-1">
                {article.preview}
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-primary mt-5">
                Read More <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </section>
      <BackToTop />
    </div>
  )
}
