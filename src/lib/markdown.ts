// Render markdown produced by the AI features (summaries, Q&A, digests).
// Input originates only from our own LLM calls.

import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false });
}
