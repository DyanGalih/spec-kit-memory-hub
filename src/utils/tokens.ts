import { get_encoding, Tiktoken } from "@dqbd/tiktoken";

let encoding: Tiktoken | null = null;

function getEncoding(): Tiktoken {
  if (!encoding) {
    encoding = get_encoding("cl100k_base");
  }
  return encoding;
}

export function estimateTokens(text: string): number {
  if (!text.trim()) {
    return 0;
  }
  return getEncoding().encode(text).length;
}

export function freeTokenizer(): void {
  if (encoding) {
    encoding.free();
    encoding = null;
  }
}
