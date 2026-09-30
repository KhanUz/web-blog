import { marked } from "marked";
import Quill from "quill";
import type { Op } from "quill";
import "quill/dist/quill.snow.css";
import "./styles/global.css";

type PreviewScope = ParentNode;
let cleanupToc: (() => void) | null = null;

marked.setOptions({
  gfm: true,
  breaks: true
});

type QuillDelta = {
  ops: Array<{ insert: string | Record<string, unknown>; attributes?: Record<string, unknown> }>;
};

function parseDelta(value: string): QuillDelta | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { ops?: unknown }).ops)) {
      return null;
    }

    return parsed as QuillDelta;
  } catch {
    return null;
  }
}

function loadQuillContent(quill: Quill, value: string): void {
  const delta = parseDelta(value);

  if (delta) {
    quill.setContents(delta.ops as Op[]);
    return;
  }

  quill.clipboard.dangerouslyPasteHTML(marked.parse(value) as string);
}

function getEditorShells(scope: PreviewScope): HTMLElement[] {
  const shells = Array.from(scope.querySelectorAll<HTMLElement>("[data-editor-shell]"));

  if (scope instanceof HTMLElement && scope.matches("[data-editor-shell]")) {
    return [scope, ...shells];
  }

  return shells;
}

function getTocPanels(scope: PreviewScope): HTMLElement[] {
  const panels = Array.from(scope.querySelectorAll<HTMLElement>("[data-toc-panel]"));

  if (scope instanceof HTMLElement && scope.matches("[data-toc-panel]")) {
    return [scope, ...panels];
  }

  return panels;
}

function setupEditorPreview(scope: PreviewScope): void {
  const shells = getEditorShells(scope);

  shells.forEach((shell) => {
    const input = shell.querySelector<HTMLInputElement>("[data-editor-input]");
    const content = shell.querySelector<HTMLInputElement>("[data-editor-content]");
    const quillElement = shell.querySelector<HTMLElement>("[data-quill-editor]");

    if (!input || !content || !quillElement || shell.dataset.previewReady === "true") {
      return;
    }

    const quill = new Quill(quillElement, { theme: "snow", modules: { toolbar: [["bold", "italic", "underline"], [{ header: [1, 2, 3, false] }], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "code-block", "link", "image"], ["clean"]] } });
    const syncContent = () => {
      const delta = quill.getContents();
      const serialized = JSON.stringify(delta);
      input.value = serialized;
      content.value = serialized;
    };

    loadQuillContent(quill, input.value);
    syncContent();
    quill.on("text-change", syncContent);
    shell.closest("form")?.addEventListener("submit", syncContent);
    shell.dataset.previewReady = "true";
  });
}

function setupQuillViewers(scope: PreviewScope): void {
  const viewers = Array.from(scope.querySelectorAll<HTMLElement>("[data-quill-viewer]"));

  if (scope instanceof HTMLElement && scope.matches("[data-quill-viewer]")) {
    viewers.unshift(scope);
  }

  viewers.forEach((viewer) => {
    if (viewer.dataset.viewerReady === "true") {
      return;
    }

    const quill = new Quill(viewer, { readOnly: true, modules: { toolbar: false } });
    loadQuillContent(quill, viewer.dataset.quillContent ?? "");
    const usedIds = new Map<string, number>();
    viewer.querySelectorAll<HTMLElement>("h1, h2, h3").forEach((heading) => {
      const base = heading.textContent?.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || "section";
      const count = usedIds.get(base) ?? 0;
      usedIds.set(base, count + 1);
      heading.id = count === 0 ? base : `${base}-${count + 1}`;
    });
    viewer.dataset.viewerReady = "true";
  });
}

function setupArticleToc(scope: PreviewScope): void {
  const panels = getTocPanels(scope);

  if (panels.length === 0) {
    cleanupToc?.();
    cleanupToc = null;
    return;
  }

  const panel = panels[0];
  const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>(".toc-link[href^='#']"));
  const items = links
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
      const section = id ? document.getElementById(id) : null;

      if (!section) {
        return null;
      }

      return { id, link, section };
    })
    .filter((item): item is { id: string; link: HTMLAnchorElement; section: HTMLElement } => item !== null);

  if (items.length === 0) {
    cleanupToc?.();
    cleanupToc = null;
    return;
  }

  cleanupToc?.();

  const setActive = (activeId: string) => {
    items.forEach(({ id, link }) => {
      link.dataset.active = String(id === activeId);
    });
  };

  const syncActive = () => {
    const threshold = 160;
    let activeId = items[0].id;

    for (const item of items) {
      if (item.section.getBoundingClientRect().top <= threshold) {
        activeId = item.id;
      } else {
        break;
      }
    }

    setActive(activeId);
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");

      if (id) {
        setActive(id);
      }
    });
  });

  syncActive();
  window.addEventListener("scroll", syncActive, { passive: true });
  window.addEventListener("resize", syncActive);
  window.addEventListener("hashchange", syncActive);

  cleanupToc = () => {
    window.removeEventListener("scroll", syncActive);
    window.removeEventListener("resize", syncActive);
    window.removeEventListener("hashchange", syncActive);
  };
}

setupEditorPreview(document);
setupQuillViewers(document);
setupArticleToc(document);

document.addEventListener("DOMContentLoaded", () => {
  setupEditorPreview(document);
  setupQuillViewers(document);
  setupArticleToc(document);
});

document.body.addEventListener("htmx:load", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement) {
    setupEditorPreview(target);
    setupQuillViewers(target);
    setupArticleToc(target);
    return;
  }

  setupEditorPreview(document);
  setupQuillViewers(document);
  setupArticleToc(document);
});

document.body.addEventListener("htmx:afterSwap", () => {
  setupEditorPreview(document);
  setupQuillViewers(document);
  setupArticleToc(document);
});
