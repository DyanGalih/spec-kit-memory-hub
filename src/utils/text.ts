import MarkdownIt from "markdown-it";

const markdownIt = new MarkdownIt({ html: false, linkify: false, typographer: false });

export const STOPWORDS = new Set([
  "able",
  "about",
  "after",
  "all",
  "also",
  "and",
  "any",
  "are",
  "before",
  "been",
  "being",
  "can",
  "does",
  "each",
  "for",
  "from",
  "have",
  "into",
  "less",
  "more",
  "must",
  "not",
  "only",
  "over",
  "should",
  "than",
  "that",
  "the",
  "then",
  "this",
  "under",
  "use",
  "used",
  "what",
  "when",
  "where",
  "will",
  "with",
  "your",
]);

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function markdownToText(markdown: string): string {
  const html = markdownIt.render(markdown);
  return normalizeWhitespace(html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " "));
}

export function wordCount(value: string): number {
  const words = value.match(/\b[\p{L}\p{N}_-]+\b/gu);
  return words ? words.length : 0;
}

export function truncateWords(value: string, maxWords: number): string {
  const words = value.match(/\b[\p{L}\p{N}_-]+\b|[^\s]+/gu) ?? [];
  if (words.length <= maxWords) {
    return normalizeWhitespace(value);
  }
  return normalizeWhitespace(words.slice(0, maxWords).join(" ")) + "...";
}

export function sentencesFromText(value: string, maxSentences: number, maxWords: number): string {
  const sentences = value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);
  const chosen: string[] = [];
  let wordTotal = 0;

  for (const sentence of sentences) {
    const sentenceWords = wordCount(sentence);
    if (sentenceWords === 0) {
      continue;
    }
    if (chosen.length >= maxSentences || wordTotal + sentenceWords > maxWords) {
      break;
    }
    chosen.push(sentence);
    wordTotal += sentenceWords;
  }

  if (chosen.length === 0 && value.trim()) {
    return truncateWords(value, maxWords);
  }

  return chosen.join(" ");
}

export function extractKeywords(value: string, maxKeywords = 8): string[] {
  const words = value
    .toLowerCase()
    .match(/\b[\p{L}\p{N}_-]{3,}\b/gu)
    ?.filter((word) => !STOPWORDS.has(word)) ?? [];

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean).map((value) => normalizeWhitespace(String(value)).toLowerCase()))]
    .filter(Boolean)
    .sort();
}
