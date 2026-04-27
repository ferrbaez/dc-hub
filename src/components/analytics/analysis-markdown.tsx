"use client";

import ReactMarkdown, { type Components } from "react-markdown";

// Component map: render Claude's markdown inside a compact analysis callout.
// No raw HTML allowed (default). Headings are de-emphasized since they sit
// inside a small box — we want h2/h3 to read as bold lines, not hero titles.
const COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed text-content last:mb-0">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-content">{children}</strong>,
  em: ({ children }) => <em className="italic text-content">{children}</em>,
  h1: ({ children }) => (
    <h4 className="mb-1 mt-2 text-sm font-semibold text-content first:mt-0">{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 className="mb-1 mt-2 text-sm font-semibold text-content first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wider text-content first:mt-0">
      {children}
    </h5>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-5 list-disc space-y-0.5 text-sm text-content last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-5 list-decimal space-y-0.5 text-sm text-content last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-penguin-obsidian/10 px-1 py-0.5 font-mono text-[11px] text-content">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-penguin-violet underline hover:text-penguin-violet-soft"
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-penguin-lime pl-3 italic text-content/80">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-penguin-lime/20" />,
};

export function AnalysisMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown components={COMPONENTS}>{content}</ReactMarkdown>
    </div>
  );
}
