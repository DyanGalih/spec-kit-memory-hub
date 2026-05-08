import matter from "gray-matter";
import path from "path";
import { ParsedChunk } from "../types";
import { markdownToText, normalizeWhitespace, sentencesFromText, STOPWORDS, truncateWords, uniqueSorted, wordCount } from "../utils/text";
import { shortId, sha256 } from "../utils/hash";

const SECTION_WORD_TARGET_MIN = 200;
const SECTION_WORD_TARGET_MAX = 800;
const SECTION_WORD_TARGET_DEFAULT = 400;

function headingLabel(pathParts: string[]): string {
  return pathParts.map((part) => normalizeWhitespace(part)).filter(Boolean).join(" / ");
}

function splitParagraphs(rawContent: string): string[] {
  return rawContent
    .split(/\n\s*\n+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitLongText(rawContent: string, maxWords = SECTION_WORD_TARGET_MAX): string[] {
  const paragraphs = splitParagraphs(rawContent);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current.join("\n\n").trim());
    }
    current = [];
    currentWords = 0;
  };

  for (const paragraph of paragraphs) {
    const paragraphWords = wordCount(markdownToText(paragraph));
    if (paragraphWords > maxWords) {
      flush();
      const sentences = splitIntoSentenceBlocks(paragraph, maxWords);
      chunks.push(...sentences);
      continue;
    }

    if (currentWords + paragraphWords > maxWords && current.length > 0) {
      flush();
    }

    current.push(paragraph);
    currentWords += paragraphWords;

    if (currentWords >= SECTION_WORD_TARGET_DEFAULT) {
      flush();
    }
  }

  flush();
  return chunks.filter(Boolean);
}

function splitIntoSentenceBlocks(rawContent: string, maxWords: number): string[] {
  const sentences = markdownToText(rawContent)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);
  const blocks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const flush = () => {
    if (current.length > 0) {
      blocks.push(current.join(" "));
    }
    current = [];
    currentWords = 0;
  };

  for (const sentence of sentences) {
    const sentenceWords = wordCount(sentence);
    if (currentWords + sentenceWords > maxWords && current.length > 0) {
      flush();
    }
    current.push(sentence);
    currentWords += sentenceWords;
  }

  flush();
  return blocks.filter(Boolean);
}

function stripFrontmatter(content: string): string {
  return matter(content).content;
}

export function parseMarkdownFile(filePath: string, rawContent: string): ParsedChunk[] {
  const content = stripFrontmatter(rawContent).replace(/\r\n/g, "\n");
  const lines = content.split("\n");
  const fileStem = path.basename(filePath, path.extname(filePath));
  const chunks: ParsedChunk[] = [];
  const headingStack: Array<{ level: number; title: string; line: number }> = [];

  let currentLines: string[] = [];
  let currentStartLine = 1;
  let currentHeadingPath = [fileStem];

  const flush = (endLine: number) => {
    const rawSection = currentLines.join("\n").trim();
    if (!rawSection) {
      return;
    }

    const textSection = markdownToText(rawSection);
    const sections = splitLongText(rawSection);
    const sectionBlocks = sections.length > 0 ? sections : [rawSection];

    for (let index = 0; index < sectionBlocks.length; index += 1) {
      const rawChunk = sectionBlocks[index];
      const textChunk = markdownToText(rawChunk);
      const chunkHeading = headingLabel(currentHeadingPath);
      const summary = sentencesFromText(textChunk, 3, 80);
      const snippet = truncateWords(textChunk, 70);
      const tags = uniqueSorted([
        fileStem,
        ...currentHeadingPath,
        ...headingWords(currentHeadingPath),
        ...extractTopicWords(summary, textChunk),
      ]);

      const chunkLineStart = currentStartLine;
      const chunkLineEnd = endLine;
      const chunkHash = sha256(
        [filePath, chunkHeading, chunkLineStart, chunkLineEnd, rawChunk, index].join("\n---\n"),
      );

      chunks.push({
        headingPath: [...currentHeadingPath],
        section_heading: chunkHeading,
        line_start: chunkLineStart,
        line_end: chunkLineEnd,
        rawContent: rawChunk,
        textContent: textChunk || textSection,
        summary,
        snippet,
        tags,
        hash: chunkHash,
      });
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);

    if (headingMatch) {
      flush(index);

      const level = headingMatch[1].length;
      const title = normalizeWhitespace(headingMatch[2]);
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, title, line: index + 1 });
      currentHeadingPath = [fileStem, ...headingStack.map((frame) => frame.title)];
      currentLines = [];
      currentStartLine = index + 2;
      continue;
    }

    currentLines.push(line);
  }

  flush(lines.length);

  return chunks;
}

function headingWords(pathParts: string[]): string[] {
  return pathParts.flatMap((part) => part.split(/[^A-Za-z0-9]+/g).filter(Boolean));
}

function extractTopicWords(summary: string, textChunk: string): string[] {
  const source = `${summary} ${textChunk}`;
  return uniqueSorted(
    source
      .toLowerCase()
      .match(/\b[a-z0-9][a-z0-9_-]{2,}\b/g)
      ?.filter((token) => !STOPWORDS.has(token)) ?? [],
  );
}
