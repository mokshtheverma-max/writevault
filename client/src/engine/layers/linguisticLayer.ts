import type { KeystrokeEvent, LayerScore } from '../types';

export function analyzeLinguisticPatterns(
  content: string,
  events: KeystrokeEvent[],
): LayerScore {
  if (content.length < 50) {
    return {
      score: 50,
      confidence: 0,
      flags: ['insufficient_content'],
      rawMetrics: { charCount: content.length },
    };
  }

  // Use events to compute session WPM (this legitimately uses the events param)
  const sessionDurationMs =
    events.length >= 2
      ? events[events.length - 1].timestamp - events[0].timestamp
      : 0;

  const words = content.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const wordCount = words.length;
  const wpm = sessionDurationMs > 0 ? (wordCount / sessionDurationMs) * 60000 : 0;

  // Sentence analysis (match text followed by sentence-ending punctuation)
  const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [];
  const sentenceLengths = sentences.map(s => s.trim().length);
  const avgSentenceLength =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
      : 0;
  const sentVariance =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((s, x) => s + (x - avgSentenceLength) ** 2, 0) /
        sentenceLengths.length
      : 0;
  const sentenceLengthVariance = Math.sqrt(sentVariance);

  // Vocabulary richness: type-token ratio
  const uniqueWords = new Set(words);
  const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  // Punctuation usage pattern
  const punctuationPattern: Record<string, number> = {
    comma: (content.match(/,/g) ?? []).length,
    period: (content.match(/\./g) ?? []).length,
    exclamation: (content.match(/!/g) ?? []).length,
    question: (content.match(/\?/g) ?? []).length,
    semicolon: (content.match(/;/g) ?? []).length,
    dash: (content.match(/[-–—]/g) ?? []).length,
  };

  // Paragraph length variance
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paraLengths = paragraphs.map(p => p.trim().length);
  const paraMean =
    paraLengths.length > 0
      ? paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length
      : 0;
  const paraVariance =
    paraLengths.length > 0
      ? paraLengths.reduce((s, x) => s + (x - paraMean) ** 2, 0) / paraLengths.length
      : 0;
  const paragraphLengthVariance = Math.sqrt(paraVariance);

  // Hedge word frequency: markers of human uncertainty/hedging
  const hedgePattern =
    /\b(perhaps|maybe|might|could|probably|possibly|i think|i believe|sort of|kind of|somewhat|rather|fairly|seems?|appears?)\b/gi;
  const hedgeMatches = content.match(hedgePattern) ?? [];
  const hedgeWordFrequency = wordCount > 0 ? hedgeMatches.length / wordCount : 0;

  // Self-reference rate: use of first-person pronouns
  const selfReferenceMatches =
    content.match(/\b(i|my|me|myself|i'm|i've|i'd|i'll)\b/gi) ?? [];
  const selfReferenceRate =
    wordCount > 0 ? selfReferenceMatches.length / wordCount : 0;

  // Contraction rate: casual human writing uses contractions
  const contractionMatches = content.match(/\b\w+'\w+\b/g) ?? [];
  const contractionRate =
    wordCount > 0 ? contractionMatches.length / wordCount : 0;

  const flags: string[] = [];
  let linguisticScore = 50;

  // Varied sentence lengths = natural human prose
  if (sentenceLengthVariance > 30) linguisticScore += 15;
  else if (sentences.length > 3 && sentenceLengthVariance < 10) {
    flags.push('uniform_sentence_lengths');
    linguisticScore -= 10;
  }

  // TTR of 0.4–0.75 is typical for human essay writing
  if (vocabularyRichness >= 0.4 && vocabularyRichness <= 0.75) {
    linguisticScore += 15;
  } else if (wordCount > 50 && vocabularyRichness > 0.9) {
    flags.push('unusually_high_vocabulary_richness');
    linguisticScore -= 5;
  }

  if (hedgeWordFrequency > 0.005) linguisticScore += 10;
  if (selfReferenceRate > 0.02) linguisticScore += 10;
  if (contractionRate > 0.01) linguisticScore += 10;
  if (paragraphLengthVariance > 100 && paragraphs.length > 2) linguisticScore += 5;

  linguisticScore = Math.max(0, Math.min(100, linguisticScore));
  const confidence = Math.min(1, wordCount / 200);

  return {
    score: linguisticScore,
    confidence,
    flags,
    rawMetrics: {
      avgSentenceLength,
      sentenceLengthVariance,
      vocabularyRichness,
      punctuationPattern,
      paragraphLengthVariance,
      hedgeWordFrequency,
      selfReferenceRate,
      contractionRate,
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      wpm,
    },
  };
}
