import { marked } from "marked";

import { escapeHtml } from "./html.js";

export type TocItem = {
  id: string;
  label: string;
  level: 1 | 2 | 3;
};

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createMarkedRenderer(toc?: TocItem[]) {
  const usedIds = new Map<string, number>();
  const renderer = new marked.Renderer();

  const getUniqueId = (label: string) => {
    const base = slugifyHeading(label) || "section";
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  renderer.link = ({ href, title, tokens }) => {
    const text = renderer.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer"${titleAttr}>${text}</a>`;
  };

  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const label = tokens.map((token) => ("text" in token ? String(token.text) : "")).join("").trim() || "Section";
    const level = Math.min(depth, 3) as 1 | 2 | 3;
    const id = getUniqueId(label);

    if (toc) {
      toc.push({ id, label, level });
    }

    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  return renderer;
}

export function renderArticleContent(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];

  const html = marked.parse(markdown, {
    gfm: true,
    breaks: false,
    renderer: createMarkedRenderer(toc)
  }) as string;

  return { html, toc };
}
