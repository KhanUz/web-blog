import { marked } from "marked";

import { escapeHtml } from "./shell.js";

export type TocItem = {
  id: string;
  label: string;
  level: 1 | 2 | 3;
};

type StoredDelta = {
  ops: Array<{ insert: unknown; attributes?: { header?: number } }>;
};

function parseStoredDelta(value: string): StoredDelta | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { ops?: unknown }).ops)) {
      return null;
    }

    return parsed as StoredDelta;
  } catch {
    return null;
  }
}

function renderDeltaToc(delta: StoredDelta): TocItem[] {
  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();
  let pendingText = "";

  for (const op of delta.ops) {
    if (typeof op.insert === "string") {
      const lines = op.insert.split("\n");
      pendingText += lines[0];

      if (lines.length > 1 && op.attributes?.header) {
        const label = pendingText.trim() || "Section";
        const base = slugifyHeading(label) || "section";
        const count = usedIds.get(base) ?? 0;
        usedIds.set(base, count + 1);
        toc.push({ id: count === 0 ? base : `${base}-${count + 1}`, label, level: Math.min(op.attributes.header, 3) as 1 | 2 | 3 });
      }

      pendingText = lines.at(-1) ?? "";
    }
  }

  return toc;
}

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
  const delta = parseStoredDelta(markdown);

  if (delta) {
    return { html: "", toc: renderDeltaToc(delta) };
  }

  const toc: TocItem[] = [];

  const html = marked.parse(markdown, {
    gfm: true,
    breaks: false,
    renderer: createMarkedRenderer(toc)
  }) as string;

  return { html, toc };
}
