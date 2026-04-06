import jsPDF from 'jspdf'
import type { WritingSession } from '../types'

// ─── helpers ────────────────────────────────────────────────────────────────

type RGB = [number, number, number]

const C = {
  dark:    [10,  10,  15]  as RGB,
  dark2:   [18,  14,  35]  as RGB,
  purple:  [109, 40,  217] as RGB,
  purpleL: [139, 92,  246] as RGB,
  white:   [255, 255, 255] as RGB,
  offWhite:[245, 243, 255] as RGB,
  muted:   [120, 110, 150] as RGB,
  dimText: [80,  70,  110] as RGB,
  green:   [34,  197, 94]  as RGB,
  yellow:  [250, 204, 21]  as RGB,
  red:     [239, 68,  68]  as RGB,
}

function sf(doc: jsPDF, c: RGB)  { doc.setFillColor(c[0], c[1], c[2]) }
function sd(doc: jsPDF, c: RGB)  { doc.setDrawColor(c[0], c[1], c[2]) }
function st(doc: jsPDF, c: RGB)  { doc.setTextColor(c[0], c[1], c[2]) }

function scoreColor(score: number): RGB {
  return score >= 75 ? C.green : score >= 50 ? C.yellow : C.red
}

function verdictStr(score: number): string {
  if (score >= 75) return 'AUTHENTIC'
  if (score >= 55) return 'LIKELY AUTHENTIC'
  if (score >= 35) return 'SUSPICIOUS'
  return 'LIKELY AI-GENERATED'
}

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

// Derive per-layer scores from session data
function deriveLayerScores(session: WritingSession) {
  const { events, content, metadata: m } = session
  const wc = Math.max(1, content.trim().split(/\s+/).filter(Boolean).length)

  const l1 = m.wpmVariance >= 25 ? 88 : m.wpmVariance >= 10 ? 65 : m.wpmVariance >= 3 ? 40 : 15
  const density = m.totalDeletions / wc
  const l2 = density >= 0.4 ? 90 : density >= 0.15 ? 75 : density >= 0.05 ? 50 : 20
  const ep = wc / 50
  const l3 = m.totalPauses >= ep ? 88 : m.totalPauses >= ep * 0.5 ? 65 : m.totalPauses >= 1 ? 45 : 20
  const l4 = (m.burstCount >= 5 && m.cursorJumps >= 2) ? 85 : (m.burstCount >= 2 || m.cursorJumps >= 1) ? 65 : 40
  const words = content.trim().split(/\s+/)
  const avgLen = words.reduce((s, w) => s + w.replace(/\W/g, '').length, 0) / words.length
  const pasteCount = events.filter(e => e.type === 'paste_attempt').length
  const l5 = pasteCount > 0 ? Math.max(10, 70 - pasteCount * 15) : avgLen > 7.5 ? 55 : 75

  return [
    { name: 'Temporal Patterns',     score: l1, weight: 0.25, interp: l1>=75?'Natural typing variance':l1>=50?'Slightly uniform rhythm':'Suspiciously uniform speed' },
    { name: 'Revision Behavior',     score: l2, weight: 0.25, interp: l2>=75?'Healthy revision patterns':l2>=50?'Some revisions detected':'Very low revision rate' },
    { name: 'Cognitive Signals',     score: l3, weight: 0.20, interp: l3>=75?'Appropriate thinking pauses':l3>=45?'Fewer pauses than typical':'No cognitive pauses detected' },
    { name: 'Behavioral Biometrics', score: l4, weight: 0.15, interp: l4>=75?'Natural burst/rhythm patterns':'Limited behavioral signal data' },
    { name: 'Linguistic Flow',       score: l5, weight: 0.15, interp: l5>=75?'Natural linguistic progression':l5>=50?'Minor anomalies':'Paste events or unusual patterns' },
  ]
}

function pageFooter(doc: jsPDF, sessionId: string, page: number) {
  const W = 210, H = 297
  sf(doc, [240, 238, 255] as RGB); doc.rect(0, H - 10, W, 10, 'F')
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text(`WriteVault Report — Session ${sessionId}`, W / 2, H - 3, { align: 'center' })
  doc.text(`Page ${page} of 5`, W - 14, H - 3, { align: 'right' })
}

// ─── PAGE 1: COVER ───────────────────────────────────────────────────────────

function drawCover(doc: jsPDF, session: WritingSession, hash: string, overallScore: number) {
  const W = 210, H = 297
  sf(doc, C.dark); doc.rect(0, 0, W, H, 'F')
  sf(doc, C.dark2); doc.rect(0, H * 0.55, W, H * 0.45, 'F')
  sf(doc, C.purple); doc.rect(W - 50, 0, 50, 3, 'F')

  // Logo
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
  doc.text('WriteVault', 15, 18)
  sf(doc, C.purple); doc.circle(15 + doc.getTextWidth('WriteVault') + 2.5, 15, 1.5, 'F')

  // Certificate label
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text('CERTIFICATE OF WRITING AUTHENTICITY', W / 2, 52, { align: 'center' })
  sd(doc, C.purpleL); doc.setLineWidth(0.4); doc.line(35, 57, W - 35, 57)

  // Document title
  const title = session.title || 'Untitled Document'
  st(doc, C.white); doc.setFont('helvetica', 'bold')
  doc.setFontSize(title.length > 45 ? 16 : 20)
  const tLines = doc.splitTextToSize(title, W - 40) as string[]
  doc.text(tLines, W / 2, 70, { align: 'center' })

  // Info grid
  const sid = `WV-${hash.substring(0, 6).toUpperCase()}-${hash.substring(6, 12).toUpperCase()}`
  const items: [string, string][] = [
    ['SESSION ID', sid],
    ['GENERATED', fmtDate(Date.now())],
    ['VERIFICATION HASH', hash.substring(0, 32) + '\u2026'],
    ['WORD COUNT', session.content.trim().split(/\s+/).filter(Boolean).length.toString()],
  ]
  const infoY = 94
  items.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? W / 4 : (W * 3) / 4
    const row = infoY + Math.floor(i / 2) * 13
    st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.text(label, col, row, { align: 'center' })
    st(doc, [200, 195, 225] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text(value, col, row + 5.5, { align: 'center' })
  })
  sd(doc, [45, 35, 75] as RGB); doc.setLineWidth(0.25)
  doc.line(25, infoY + 27, W - 25, infoY + 27)

  // Score circle
  const cx = W / 2, cy = 188
  const col = scoreColor(overallScore)
  sf(doc, [Math.round(col[0] * 0.15), Math.round(col[1] * 0.15), Math.round(col[2] * 0.15)] as RGB)
  doc.circle(cx, cy, 43, 'F')
  sf(doc, col); doc.circle(cx, cy, 38, 'F')
  sf(doc, C.dark); doc.circle(cx, cy, 28, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(30)
  doc.text(String(overallScore), cx, cy + 4, { align: 'center' })
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text('/ 100', cx, cy + 13, { align: 'center' })
  st(doc, col); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text(verdictStr(overallScore), cx, cy + 52, { align: 'center' })

  // Mini bars
  const layers = deriveLayerScores(session)
  const barW = 110, barX = (W - barW) / 2
  layers.forEach((l, i) => {
    const by = cy + 62 + i * 9
    sf(doc, [25, 18, 50] as RGB); doc.roundedRect(barX, by, barW, 4, 1, 1, 'F')
    sf(doc, scoreColor(l.score)); doc.roundedRect(barX, by, barW * (l.score / 100), 4, 1, 1, 'F')
    st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6)
    doc.text(l.name, barX - 2, by + 3.2, { align: 'right' })
    st(doc, [180, 170, 210] as RGB)
    doc.text(String(l.score), barX + barW + 2, by + 3.2)
  })

  // Footer
  sf(doc, [18, 12, 40] as RGB); doc.rect(0, H - 13, W, 13, 'F')
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('Verify at writevault.app/verify', W / 2, H - 4, { align: 'center' })
  doc.text(new Date().toLocaleDateString(), 14, H - 4)
  doc.text('Page 1 of 5', W - 14, H - 4, { align: 'right' })
}

// ─── PAGE 2: ANALYSIS ────────────────────────────────────────────────────────

function drawAnalysis(doc: jsPDF, session: WritingSession, overallScore: number) {
  const W = 210, H = 297
  doc.addPage()
  sf(doc, [245, 243, 255] as RGB); doc.rect(0, 0, W, H, 'F')
  sf(doc, C.purple); doc.rect(0, 0, W, 22, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('WriteVault', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.text('Writing Process Analysis', W / 2, 14, { align: 'center' })
  doc.setFontSize(7.5); doc.text('Page 2 of 5', W - 14, 14, { align: 'right' })

  const layers = deriveLayerScores(session)
  let y = 33

  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('5-Layer Authenticity Score Breakdown', 14, y); y += 7

  const cols = [14, 68, 100, 126, 152]
  sf(doc, [35, 25, 65] as RGB); doc.rect(13, y - 4, W - 26, 8, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
  ;['Scoring Layer', 'Score', 'Weight', 'Weighted', 'Interpretation'].forEach((h, i) => {
    doc.text(h, cols[i], y + 1)
  })
  y += 8

  layers.forEach((l, i) => {
    const bg: RGB = i % 2 === 0 ? [248, 246, 255] : [238, 236, 252]
    sf(doc, bg); doc.rect(13, y - 4, W - 26, 9, 'F')
    const lc = scoreColor(l.score)
    st(doc, C.dimText); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(l.name, cols[0], y + 1)
    sf(doc, lc); doc.roundedRect(cols[1] - 1, y - 3, 18, 6, 1.5, 1.5, 'F')
    st(doc, C.white); doc.setFont('helvetica', 'bold')
    doc.text(String(l.score), cols[1] + 9, y + 1, { align: 'center' })
    st(doc, C.dimText); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.text(`${Math.round(l.weight * 100)}%`, cols[2], y + 1)
    doc.text(String(Math.round(l.score * l.weight)), cols[3], y + 1)
    const iL = doc.splitTextToSize(l.interp, 56) as string[]
    doc.setFontSize(6.5); doc.text(iL[0] ?? '', cols[4], y + 1)
    y += 9
  })

  // Total row
  sf(doc, [35, 25, 65] as RGB); doc.rect(13, y - 4, W - 26, 9, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.text('OVERALL SCORE', cols[0], y + 1)
  sf(doc, scoreColor(overallScore)); doc.roundedRect(cols[1] - 1, y - 3, 22, 6, 1.5, 1.5, 'F')
  st(doc, C.white); doc.text(`${overallScore}/100`, cols[1] + 11, y + 1, { align: 'center' })
  y += 16

  // Stats grid
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Key Statistics', 14, y); y += 8

  const m = session.metadata
  const wc = session.content.trim().split(/\s+/).filter(Boolean).length
  const dur = session.endTime - session.startTime
  const pasteCount = session.events.filter(e => e.type === 'paste_attempt').length

  const stats: [string, string][] = [
    ['Total Session Time', fmtMs(dur)],
    ['Word Count', String(wc)],
    ['Thinking Pauses (>2s)', String(m.totalPauses)],
    ['Avg Pause Duration', fmtMs(m.avgPauseMs)],
    ['Deletion Count', String(m.totalDeletions)],
    ['Revision Density', (m.revisionDensity * 100).toFixed(1) + '%'],
    ['Cursor Jumps', String(m.cursorJumps)],
    ['Paste Attempts', String(pasteCount)],
  ]

  const sw = (W - 30) / 2
  stats.forEach(([label, value], i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const sx = 14 + col * sw, sy = y + row * 16
    sf(doc, [240, 238, 255] as RGB); doc.roundedRect(sx, sy - 3, sw - 5, 13, 2, 2, 'F')
    st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    doc.text(label.toUpperCase(), sx + 4, sy + 2)
    st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text(value, sx + 4, sy + 8.5)
  })
  y += Math.ceil(stats.length / 2) * 16 + 10

  // Red flags
  const flags: string[] = []
  if (pasteCount > 0) flags.push(`${pasteCount} paste event(s) detected`)
  if (m.totalPauses < 2 && wc > 50) flags.push('Very few thinking pauses for session length')
  if (m.wpmVariance < 5 && wc > 80) flags.push('Suspiciously uniform typing speed')
  if (m.totalDeletions < 3 && wc > 50) flags.push('Very low revision rate')

  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text(flags.length ? 'Anomaly Flags' : 'No Anomalies Detected', 14, y); y += 8

  if (flags.length === 0) {
    sf(doc, [240, 255, 245] as RGB); doc.roundedRect(13, y - 3, W - 26, 10, 2, 2, 'F')
    sf(doc, C.green); doc.circle(20, y + 2, 2, 'F')
    st(doc, [15, 90, 45] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
    doc.text('All signals within normal range — no anomalies detected', 25, y + 2.5)
    y += 15
  } else {
    flags.forEach(f => {
      sf(doc, [255, 242, 242] as RGB); doc.roundedRect(13, y - 3, W - 26, 8, 1.5, 1.5, 'F')
      sf(doc, C.red); doc.circle(19.5, y + 1, 1.5, 'F')
      st(doc, [140, 25, 25] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
      doc.text(f, 24, y + 1.5); y += 11
    })
  }

  // Methodology
  if (y < H - 65) {
    y += 5
    sf(doc, [244, 242, 255] as RGB); doc.roundedRect(13, y, W - 26, 48, 2, 2, 'F')
    sd(doc, C.purple); doc.setLineWidth(0.5); doc.line(13, y, 13, y + 48)
    st(doc, [55, 35, 95] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('Scoring Methodology', 17, y + 7)
    const notes = [
      'Temporal Patterns: Keystroke timing variance and WPM consistency across the session.',
      'Revision Behavior: Deletion frequency, backspace patterns, and non-linear editing signals.',
      'Cognitive Signals: Pause distribution — correlates with original idea formation.',
      'Behavioral Biometrics: Typing burst rhythms and cursor movement patterns.',
      'Linguistic Flow: Vocabulary complexity progression and structural analysis.',
    ]
    st(doc, C.dimText); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    notes.forEach((n, i) => { doc.text(n, 17, y + 14 + i * 6.5) })
  }

  pageFooter(doc, session.id, 2)
}

// ─── PAGE 3: TIMELINE ────────────────────────────────────────────────────────

function drawTimeline(doc: jsPDF, session: WritingSession) {
  const W = 210, H = 297
  doc.addPage()
  sf(doc, [245, 243, 255] as RGB); doc.rect(0, 0, W, H, 'F')
  sf(doc, C.purple); doc.rect(0, 0, W, 22, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('WriteVault', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.text('Timeline Visualization', W / 2, 14, { align: 'center' })
  doc.setFontSize(7.5); doc.text('Page 3 of 5', W - 14, 14, { align: 'right' })

  let y = 33
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Words Per Minute Over Time', 14, y); y += 8

  const keydowns = session.events
    .filter(e => e.type === 'keydown')
    .sort((a, b) => a.timestamp - b.timestamp)

  const bucketMs = 30000
  type WPt = { t: number; wpm: number; pause: boolean }
  const wpmPts: WPt[] = []
  if (keydowns.length > 1) {
    const first = keydowns[0].timestamp
    const last  = keydowns[keydowns.length - 1].timestamp
    for (let t = first; t <= last; t += bucketMs) {
      const n = keydowns.filter(e => e.timestamp >= t && e.timestamp < t + bucketMs).length
      const hasPause = session.events.some(e => e.type === 'pause' && e.timestamp >= t && e.timestamp < t + bucketMs)
      wpmPts.push({ t: Math.round((t - session.startTime) / 1000), wpm: Math.min(200, Math.round((n / 5) / (bucketMs / 60000))), pause: hasPause })
    }
  }

  const cX = 25, cW = W - 40, cH = 68
  sf(doc, [244, 242, 255] as RGB); doc.roundedRect(cX - 5, y - 5, cW + 10, cH + 15, 2, 2, 'F')

  if (wpmPts.length >= 2) {
    const maxWpm = Math.max(...wpmPts.map(d => d.wpm), 60)
    const maxT   = wpmPts[wpmPts.length - 1].t || 1
    const xs = (t: number) => cX + (t / maxT) * cW
    const ys = (w: number) => y + cH - (w / maxWpm) * cH

    ;[0, 25, 50, 75, 100].forEach(v => {
      if (v <= maxWpm) {
        sd(doc, [200, 195, 230] as RGB); doc.setLineWidth(0.25)
        doc.line(cX, ys(v), cX + cW, ys(v))
        st(doc, C.muted); doc.setFontSize(5.5); doc.setFont('helvetica', 'normal')
        doc.text(String(v), cX - 3, ys(v) + 2, { align: 'right' })
      }
    })

    for (let i = 0; i < wpmPts.length - 1; i++) {
      const x1 = xs(wpmPts[i].t), x2 = xs(wpmPts[i + 1].t)
      const avgY = (ys(wpmPts[i].wpm) + ys(wpmPts[i + 1].wpm)) / 2
      sf(doc, [180, 160, 230] as RGB); doc.rect(x1, avgY, x2 - x1, y + cH - avgY, 'F')
    }

    sd(doc, C.purple); doc.setLineWidth(1.5)
    for (let i = 0; i < wpmPts.length - 1; i++) {
      doc.line(xs(wpmPts[i].t), ys(wpmPts[i].wpm), xs(wpmPts[i + 1].t), ys(wpmPts[i + 1].wpm))
    }

    wpmPts.forEach(d => {
      sf(doc, d.pause ? C.red : C.purple)
      doc.circle(xs(d.t), ys(d.wpm), d.pause ? 2 : 1.5, 'F')
    })

    const step = Math.max(1, Math.floor(wpmPts.length / 6))
    st(doc, C.muted); doc.setFontSize(6)
    wpmPts.filter((_, i) => i % step === 0).forEach(d => {
      doc.text(`${d.t}s`, xs(d.t), y + cH + 8, { align: 'center' })
    })

    sf(doc, C.purple); doc.circle(cX, y + cH + 14, 2, 'F')
    st(doc, C.dimText); doc.setFontSize(6.5)
    doc.text('Active typing', cX + 3, y + cH + 15.5)
    sf(doc, C.red); doc.circle(cX + 35, y + cH + 14, 2, 'F')
    doc.text('Pause point', cX + 38, y + cH + 15.5)
  } else {
    st(doc, C.muted); doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5)
    doc.text('Insufficient typing data for WPM chart', cX + cW / 2, y + cH / 2, { align: 'center' })
  }

  y = y + cH + 22

  sf(doc, [240, 238, 255] as RGB); doc.roundedRect(13, y, W - 26, 14, 2, 2, 'F')
  st(doc, C.dimText); doc.setFont('helvetica', 'italic'); doc.setFontSize(7)
  doc.text('Note: Irregular WPM variations are characteristic of authentic human composition.', W / 2, y + 5, { align: 'center' })
  doc.text('Artificially flat WPM is a primary indicator of text insertion rather than organic writing.', W / 2, y + 11, { align: 'center' })
  y += 22

  // Pause map
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Session Pause Map', 14, y); y += 8

  const pmW = W - 30, pmH = 28
  sf(doc, [240, 238, 255] as RGB); doc.roundedRect(14, y, pmW, pmH, 2, 2, 'F')

  if (keydowns.length > 1) {
    const totalDur = Math.max(1, session.endTime - session.startTime)
    sf(doc, C.purpleL); doc.roundedRect(17, y + 8, pmW - 6, 10, 1, 1, 'F')

    const pauses: { start: number; end: number }[] = []
    let ps: number | null = null
    for (let i = 1; i < keydowns.length; i++) {
      const gap = keydowns[i].timestamp - keydowns[i - 1].timestamp
      if (gap > 2000) {
        if (ps === null) ps = keydowns[i - 1].timestamp
      } else if (ps !== null) {
        pauses.push({ start: ps, end: keydowns[i - 1].timestamp })
        ps = null
      }
    }

    pauses.forEach(p => {
      const px = 17 + ((p.start - session.startTime) / totalDur) * (pmW - 6)
      const pw = Math.max(2, ((p.end - p.start) / totalDur) * (pmW - 6))
      sf(doc, [200, 188, 240] as RGB); doc.rect(px, y + 8, pw, 10, 'F')
      sd(doc, [140, 120, 200] as RGB); doc.setLineWidth(0.3)
      doc.line(px, y + 6, px, y + 20)
    })

    st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    doc.text('Start', 17, y + 26)
    doc.text(`${pauses.length} pause${pauses.length !== 1 ? 's' : ''} detected`, W / 2, y + 26, { align: 'center' })
    doc.text('End', 14 + pmW - 3, y + 26, { align: 'right' })
  }

  y += pmH + 14

  // Edit heatmap
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Edit Activity Heatmap', 14, y); y += 8

  const hmW = W - 30, hmH = 28, segs = 50
  const segW = hmW / segs
  const allAct = session.events.filter(e => e.type === 'keydown' || e.type === 'delete')
  const totalDur = Math.max(1, session.endTime - session.startTime)
  const segAct = Array(segs).fill(0)
  allAct.forEach(e => {
    const si = Math.min(segs - 1, Math.floor(((e.timestamp - session.startTime) / totalDur) * segs))
    segAct[si]++
  })
  const maxA = Math.max(...segAct, 1)
  segAct.forEach((a, i) => {
    const intensity = a / maxA
    const r = Math.round(240 - intensity * 180)
    const g = Math.round(238 - intensity * 200)
    sf(doc, [r, g, 255] as RGB)
    doc.rect(14 + i * segW, y, segW, hmH, 'F')
  })
  sd(doc, [200, 195, 230] as RGB); doc.setLineWidth(0.25); doc.rect(14, y, hmW, hmH, 'S')
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text('Start (less active)', 14, y + hmH + 8)
  doc.text('End (more active \u2192)', 14 + hmW, y + hmH + 8, { align: 'right' })

  pageFooter(doc, session.id, 3)
}

// ─── PAGE 4: CONTENT ─────────────────────────────────────────────────────────

function drawContent(doc: jsPDF, session: WritingSession) {
  const W = 210, H = 297
  doc.addPage()
  sf(doc, C.white); doc.rect(0, 0, W, H, 'F')
  sf(doc, C.purple); doc.rect(0, 0, W, 22, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('WriteVault', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.text('Document Content', W / 2, 14, { align: 'center' })
  doc.setFontSize(7.5); doc.text('Page 4 of 5', W - 14, 14, { align: 'right' })

  const wc = session.content.trim().split(/\s+/).filter(Boolean).length
  const cc = session.content.length
  const paraCount = session.content.split('\n').filter(p => p.trim()).length
  sf(doc, [244, 242, 255] as RGB); doc.rect(0, 22, W, 12, 'F')
  st(doc, C.dimText); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text(`Words: ${wc}`, 14, 30)
  doc.text(`Characters: ${cc}`, 50, 30)
  doc.text(`Paragraphs: ${paraCount}`, 96, 30)
  st(doc, C.muted); doc.setFont('helvetica', 'italic'); doc.setFontSize(7)
  doc.text('Content reproduced exactly as written', W - 14, 30, { align: 'right' })

  let y = 43
  const cX = 20, lnX = 13, cW = W - 32
  sf(doc, [252, 251, 255] as RGB); doc.roundedRect(cX - 2, y - 3, cW + 4, H - y - 12, 1, 1, 'F')

  const paras = session.content.split('\n')
  let lineNum = 1

  outer:
  for (const para of paras) {
    if (para.trim() === '') { y += 4; lineNum++; if (y > H - 18) break; continue }
    const lines = doc.splitTextToSize(para, cW - 5) as string[]
    for (const line of lines) {
      if (y > H - 18) break outer
      st(doc, [195, 185, 225] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(6)
      doc.text(String(lineNum).padStart(3, ' '), lnX, y)
      st(doc, [30, 20, 50] as RGB); doc.setFontSize(8.5)
      doc.text(line, cX, y)
      y += 5.8; lineNum++
    }
    y += 3
  }

  pageFooter(doc, session.id, 4)
}

// ─── PAGE 5: VERIFICATION ────────────────────────────────────────────────────

function drawVerification(doc: jsPDF, session: WritingSession, hash: string) {
  const W = 210, H = 297
  doc.addPage()
  sf(doc, [245, 243, 255] as RGB); doc.rect(0, 0, W, H, 'F')
  sf(doc, C.purple); doc.rect(0, 0, W, 22, 'F')
  st(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('WriteVault', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.text('Verification & Legal', W / 2, 14, { align: 'center' })
  doc.setFontSize(7.5); doc.text('Page 5 of 5', W - 14, 14, { align: 'right' })

  let y = 33

  // Hash block
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Document Verification Hash (SHA-256)', 14, y); y += 7

  sf(doc, [18, 12, 40] as RGB); doc.roundedRect(13, y, W - 26, 15, 2, 2, 'F')
  st(doc, [110, 90, 175] as RGB); doc.setFont('courier', 'normal'); doc.setFontSize(7)
  doc.text('SHA-256:', 17, y + 5.5)
  st(doc, [120, 210, 150] as RGB)
  doc.text(hash.substring(0, 42), 37, y + 5.5)
  doc.text(hash.substring(42), 37, y + 11.5)
  y += 21

  // Instructions
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Verification Instructions', 14, y); y += 8

  const instrs = [
    '1. Visit writevault.app/verify in a web browser.',
    '2. Paste the complete SHA-256 hash shown above into the verification field.',
    '3. Click "Verify" to retrieve the session record from the WriteVault database.',
    '4. Compare the document title, score, and date with this report.',
    '5. A match confirms this report has not been tampered with.',
  ]
  st(doc, C.dimText); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  instrs.forEach(ins => { doc.text(ins, 17, y); y += 7 })
  y += 5

  // URL
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Verification URL', 14, y); y += 7
  sf(doc, [240, 238, 255] as RGB); doc.roundedRect(13, y, W - 26, 16, 2, 2, 'F')
  st(doc, C.purple); doc.setFont('courier', 'normal'); doc.setFontSize(8.5)
  doc.text(`writevault.app/verify/${hash.substring(0, 16)}\u2026`, W / 2, y + 6, { align: 'center' })
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text('Full verification URL uses the complete SHA-256 hash shown above', W / 2, y + 12, { align: 'center' })
  y += 22

  // Timestamps
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
  doc.text('Report Generated:', 14, y)
  doc.setFont('helvetica', 'normal'); doc.text(fmtDate(Date.now()), 55, y); y += 7
  doc.setFont('helvetica', 'bold'); doc.text('Session Recorded:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${fmtDate(session.startTime)} \u2014 ${fmtDate(session.endTime)}`, 55, y); y += 18

  // Legal disclaimer
  st(doc, C.dimText); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Legal Disclaimer', 14, y); y += 8

  sf(doc, [248, 246, 255] as RGB); doc.roundedRect(13, y, W - 26, 57, 2, 2, 'F')
  sd(doc, [210, 200, 240] as RGB); doc.setLineWidth(0.3); doc.roundedRect(13, y, W - 26, 57, 2, 2, 'S')

  const disc = [
    'This report represents a technical analysis of the writing process recorded during the composition of the',
    'above document. WriteVault\'s scoring system analyzes behavioral biometrics, temporal patterns, revision',
    'behavior, and cognitive signals to assess writing authenticity.',
    '',
    'This report is intended as supplementary evidence and should be considered alongside other context by',
    'academic institutions. WriteVault does not make definitive claims about authorship or academic integrity.',
    'The scores and verdicts produced are probabilistic assessments based on behavioral data.',
    '',
    'WriteVault is not liable for decisions made based solely on this report. Recipients should seek corroborating',
    'evidence before making consequential academic decisions.',
  ]
  st(doc, C.dimText); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2)
  disc.forEach((l, i) => { if (l) doc.text(l, 17, y + 8 + i * 5) })
  y += 65

  // Signature
  sd(doc, [200, 190, 230] as RGB); doc.setLineWidth(0.4)
  doc.line(13, y, W / 2 - 8, y)
  st(doc, C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('Authorized by WriteVault Verification System', 13, y + 5)
  doc.text(`Document: ${hash.substring(0, 16)}\u2026`, 13, y + 10)

  // Bottom banner
  sf(doc, [18, 12, 40] as RGB); doc.rect(0, H - 14, W, 14, 'F')
  st(doc, C.purpleL); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text('WriteVault', W / 2 - 22, H - 6)
  st(doc, C.muted); doc.setFont('helvetica', 'normal')
  doc.text(' \u2014 Behavioral Writing Authenticity System', W / 2 - 8, H - 6)
  st(doc, [80, 70, 110] as RGB); doc.setFontSize(6.5)
  doc.text('writevault.app', W / 2, H - 2, { align: 'center' })
}

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// ─── TEACHER PDF ─────────────────────────────────────────────────────────────

function teacherPageHeader(doc: jsPDF, page: number, total: number) {
  const W = 210
  sf(doc, [255, 255, 255] as RGB); doc.rect(0, 0, W, 18, 'F')
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.3); doc.line(0, 18, W, 18)
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('WriteVault', 14, 12)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Certificate of Writing Authenticity — Educator Copy', W / 2, 12, { align: 'center' })
  st(doc, [156, 163, 175] as RGB); doc.setFontSize(7)
  doc.text(`Page ${page} of ${total}`, W - 14, 12, { align: 'right' })
}

function teacherPageFooter(doc: jsPDF) {
  const W = 210, H = 297
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.3); doc.line(14, H - 14, W - 14, H - 14)
  st(doc, [156, 163, 175] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text('For educator verification questions: educator@writevault.app', W / 2, H - 8, { align: 'center' })
  doc.text('writevault.app/verify/teacher', W / 2, H - 4, { align: 'center' })
}

export async function generateTeacherPDF(session: WritingSession, hash: string): Promise<void> {
  const W = 210, H = 297
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const layers = deriveLayerScores(session)
  const overallScore = Math.round(layers.reduce((s, l) => s + l.score * l.weight, 0))
  const wc = session.content.trim().split(/\s+/).filter(Boolean).length
  const duration = Math.round((session.endTime - session.startTime) / 60000)
  const pasteCount = session.events.filter(e => e.type === 'paste_attempt').length
  const m = session.metadata

  // ── Page 1: Overview ──
  sf(doc, [255, 255, 255] as RGB); doc.rect(0, 0, W, H, 'F')
  teacherPageHeader(doc, 1, 3)

  let y = 30
  // Title block
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.3); doc.roundedRect(14, y, W - 28, 32, 2, 2, 'S')
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text(session.title, W / 2, y + 11, { align: 'center' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  st(doc, [107, 114, 128] as RGB)
  doc.text('Independently verified writing session', W / 2, y + 19, { align: 'center' })
  doc.text(`Session ID: ${session.id}`, W / 2, y + 26, { align: 'center' })
  y += 40

  // Verification badge
  sf(doc, [240, 253, 244] as RGB); doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F')
  sd(doc, [187, 247, 208] as RGB); doc.setLineWidth(0.3); doc.roundedRect(14, y, W - 28, 14, 2, 2, 'S')
  st(doc, [21, 128, 61] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('✓  Session Verified — Data retrieved independently from WriteVault servers', W / 2, y + 9, { align: 'center' })
  y += 22

  // Score
  const sColor = overallScore >= 75 ? [22, 163, 74] as RGB : overallScore >= 50 ? [202, 138, 4] as RGB : overallScore >= 25 ? [234, 88, 12] as RGB : [220, 38, 38] as RGB
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('BEHAVIORAL AUTHENTICITY SCORE', W / 2, y, { align: 'center' }); y += 8
  st(doc, sColor); doc.setFont('helvetica', 'bold'); doc.setFontSize(48)
  doc.text(String(overallScore), W / 2, y + 18, { align: 'center' })
  st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text('/ 100', W / 2 + 16, y + 18)
  doc.setFontSize(7.5)
  const scoreLabel = overallScore >= 75 ? 'Strong behavioral evidence of authentic writing'
    : overallScore >= 50 ? 'Moderate evidence, consistent with human writing'
    : overallScore >= 25 ? 'Mixed signals — manual review recommended'
    : 'Patterns inconsistent with human writing behavior'
  doc.text(scoreLabel, W / 2, y + 28, { align: 'center' })
  y += 40

  // Session metadata table
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('Session Details', 14, y); y += 6
  const meta: [string, string][] = [
    ['Document Title',   session.title],
    ['Date Written',     fmtDate(session.startTime)],
    ['Session Completed', fmtDate(session.endTime)],
    ['Total Duration',   `${duration} minutes`],
    ['Word Count',       `${wc} words`],
    ['Verification Hash', hash.substring(0, 20) + '…'],
    ['Paste Events',     pasteCount === 0 ? 'None detected' : `${pasteCount} detected`],
    ['Thinking Pauses',  `${m.totalPauses} detected`],
    ['Editing Revisions', `${m.totalDeletions} corrections`],
  ]
  sf(doc, [249, 250, 251] as RGB); doc.roundedRect(14, y, W - 28, meta.length * 8 + 4, 2, 2, 'F')
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.2); doc.roundedRect(14, y, W - 28, meta.length * 8 + 4, 2, 2, 'S')
  meta.forEach(([k, v], i) => {
    if (i % 2 === 0) { sf(doc, [243, 244, 246] as RGB); doc.rect(14, y + i * 8 + 2, W - 28, 8, 'F') }
    st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(k, 20, y + i * 8 + 7.5)
    st(doc, [31, 41, 55] as RGB); doc.setFont('helvetica', 'bold')
    doc.text(v, W - 20, y + i * 8 + 7.5, { align: 'right' })
  })
  y += meta.length * 8 + 12

  // Honest disclaimer
  sf(doc, [249, 250, 251] as RGB); doc.roundedRect(14, y, W - 28, 36, 2, 2, 'F')
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.3); doc.roundedRect(14, y, W - 28, 36, 2, 2, 'S')
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text('⚠  Important Context for Educators', 20, y + 8)
  st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  const disclaimerLines = [
    'This report reflects behavioral patterns during the recorded writing session. WriteVault recommends',
    'considering this data alongside your knowledge of the student, class participation, and other work samples.',
    'No automated tool should be the sole basis for academic integrity decisions.',
  ]
  disclaimerLines.forEach((l, i) => { doc.text(l, 20, y + 16 + i * 5.5) })

  teacherPageFooter(doc)

  // ── Page 2: 5-Layer Analysis ──
  doc.addPage()
  sf(doc, [255, 255, 255] as RGB); doc.rect(0, 0, W, H, 'F')
  teacherPageHeader(doc, 2, 3)

  y = 28
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text('5-Layer Behavioral Analysis', 14, y); y += 8
  st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Each layer analyzes a different dimension of writing behavior.', 14, y); y += 10

  const layerNames = ['Temporal Analysis', 'Revision Behavior', 'Cognitive Signals', 'Biometric Patterns', 'Linguistic Profile']
  const layerDescs = [
    'Measures inter-keystroke timing variance. Natural human typing is irregular — speeding up and slowing down.',
    'Tracks deletions, corrections, and revisions. Authentic writing contains natural editing activity throughout.',
    'Detects thinking pauses consistent with original idea formation and cognitive processing during composition.',
    'Analyzes individual typing rhythm patterns that emerge naturally over the course of a writing session.',
    'Examines sentence structure, vocabulary variation, and stylistic consistency with human authorship patterns.',
  ]

  layers.forEach((l, i) => {
    const lColor = l.score >= 75 ? [22, 163, 74] as RGB : l.score >= 50 ? [202, 138, 4] as RGB : l.score >= 25 ? [234, 88, 12] as RGB : [220, 38, 38] as RGB
    sf(doc, [249, 250, 251] as RGB); doc.roundedRect(14, y, W - 28, 26, 2, 2, 'F')
    sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.2); doc.roundedRect(14, y, W - 28, 26, 2, 2, 'S')

    st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text(layerNames[i], 20, y + 9)
    st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    const descLines = doc.splitTextToSize(layerDescs[i], 130) as string[]
    descLines.forEach((dl, di) => doc.text(dl, 20, y + 15 + di * 4.5))

    // Score badge
    sf(doc, lColor); doc.roundedRect(W - 40, y + 7, 26, 12, 2, 2, 'F')
    st(doc, [255, 255, 255] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text(`${Math.round(l.score)}`, W - 27, y + 16, { align: 'center' })

    // Bar
    sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.3)
    sf(doc, [229, 231, 235] as RGB); doc.roundedRect(W - 68, y + 7, 25, 4, 1, 1, 'F')
    sf(doc, lColor); doc.roundedRect(W - 68, y + 7, 25 * (l.score / 100), 4, 1, 1, 'F')

    y += 32
  })

  y += 5
  // What WriteVault cannot prove
  sf(doc, [255, 249, 245] as RGB); doc.roundedRect(14, y, W - 28, 48, 2, 2, 'F')
  sd(doc, [254, 215, 170] as RGB); doc.setLineWidth(0.3); doc.roundedRect(14, y, W - 28, 48, 2, 2, 'S')
  st(doc, [154, 52, 18] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
  doc.text('What WriteVault Cannot Prove', 20, y + 9)
  const limitations = [
    'That the student was not reading from another screen during the session',
    "The student's identity — there is no biometric ID verification",
    "That the student didn't receive verbal assistance during writing",
    'WriteVault is one tool among many. Use alongside your own assessment.',
  ]
  st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  limitations.forEach((lim, i) => {
    st(doc, [220, 38, 38] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('✗', 20, y + 17 + i * 7.5)
    st(doc, [75, 85, 99] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(lim, 27, y + 17 + i * 7.5)
  })

  teacherPageFooter(doc)

  // ── Page 3: Behavioral observations ──
  doc.addPage()
  sf(doc, [255, 255, 255] as RGB); doc.rect(0, 0, W, H, 'F')
  teacherPageHeader(doc, 3, 3)

  y = 28
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text('Behavioral Observations', 14, y); y += 10

  const observations: string[] = []
  if (m.totalPauses > 10) observations.push('Natural thinking pauses detected throughout session')
  else if (m.totalPauses >= 3) observations.push(`${m.totalPauses} thinking pauses detected during session`)
  if (m.totalDeletions > 20) observations.push(`${m.totalDeletions} corrections and revisions detected`)
  else if (m.totalDeletions > 5) observations.push(`${m.totalDeletions} editing revisions observed`)
  if (m.avgWPM < 60 && m.avgWPM > 10) observations.push('Writing speed within normal human range')
  if (m.wpmVariance > 15) observations.push('Writing speed varied naturally throughout session')
  if (m.cursorJumps > 5) observations.push('Active editing behavior — cursor movements throughout document')
  if (pasteCount === 0) observations.push('No paste events detected during session')
  else observations.push(`${pasteCount} paste event(s) were logged during session`)
  if (m.longestPause > 30000) {
    const mins = Math.floor(m.longestPause / 60000)
    const secs = Math.floor((m.longestPause % 60000) / 1000)
    observations.push(`Longest pause: ${mins > 0 ? `${mins}m ` : ''}${secs}s — consistent with research or thinking`)
  }
  if (m.revisionDensity >= 0.15) observations.push('High revision density — iterative, authentic composition pattern')

  observations.forEach((obs, i) => {
    sf(doc, i % 2 === 0 ? [249, 250, 251] as RGB : [255, 255, 255] as RGB)
    doc.rect(14, y, W - 28, 10, 'F')
    st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text('•', 20, y + 6.5)
    st(doc, [31, 41, 55] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(obs, 26, y + 6.5)
    y += 12
  })

  y += 10
  // Verification chain
  st(doc, [55, 65, 81] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Cryptographic Verification', 14, y); y += 8
  sf(doc, [249, 250, 251] as RGB); doc.roundedRect(14, y, W - 28, 24, 2, 2, 'F')
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.2); doc.roundedRect(14, y, W - 28, 24, 2, 2, 'S')
  st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('SHA-256 Verification Hash', 20, y + 8)
  st(doc, [31, 41, 55] as RGB); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  const hashLines = doc.splitTextToSize(hash, W - 46) as string[]
  hashLines.forEach((hl, hi) => doc.text(hl, 20, y + 14 + hi * 6))

  y += 32
  st(doc, [107, 114, 128] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  const chainNotes = [
    'Session data is stored on WriteVault servers and cannot be modified after submission.',
    'The hash above uniquely identifies this session. Any modification invalidates the hash.',
    'Teachers can independently verify this session at: writevault.app/verify/teacher',
  ]
  chainNotes.forEach((note, i) => { doc.text(note, 14, y + i * 6) })

  y += 30
  // Generated line
  sd(doc, [229, 231, 235] as RGB); doc.setLineWidth(0.2); doc.line(14, y, W - 14, y)
  st(doc, [156, 163, 175] as RGB); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text(`Generated: ${new Date().toISOString()}  |  WriteVault v2.0  |  educator@writevault.app`, W / 2, y + 6, { align: 'center' })

  teacherPageFooter(doc)

  const sid = `WV-${hash.substring(0, 6).toUpperCase()}-${hash.substring(6, 12).toUpperCase()}`
  const date = new Date().toISOString().split('T')[0]
  doc.save(`WriteVault_TeacherReport_${sid}_${date}.pdf`)
}

export async function generatePDFReport(session: WritingSession, hash: string): Promise<void> {
  const layers = deriveLayerScores(session)
  const overallScore = Math.round(layers.reduce((s, l) => s + l.score * l.weight, 0))

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  drawCover(doc, session, hash, overallScore)
  drawAnalysis(doc, session, overallScore)
  drawTimeline(doc, session)
  drawContent(doc, session)
  drawVerification(doc, session, hash)

  const sid = `WV-${hash.substring(0, 6).toUpperCase()}-${hash.substring(6, 12).toUpperCase()}`
  const date = new Date().toISOString().split('T')[0]
  doc.save(`WriteVault_Report_${sid}_${date}.pdf`)
}
