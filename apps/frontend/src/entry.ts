import "./styles/global.css";
import { marked } from "marked";

type PreviewScope = ParentNode;
let cleanupToc: (() => void) | null = null;

marked.setOptions({
  gfm: true,
  breaks: true
});

function syncEditorHeight(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function renderMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
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
    const input = shell.querySelector<HTMLTextAreaElement>("[data-editor-input]");
    const output = shell.querySelector<HTMLElement>("[data-editor-preview]");

    if (!input || !output || shell.dataset.previewReady === "true") {
      return;
    }

    const syncPreview = () => {
      output.innerHTML = renderMarkdown(input.value);
      syncEditorHeight(input);
    };

    syncPreview();
    input.addEventListener("input", syncPreview);
    shell.dataset.previewReady = "true";
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
setupArticleToc(document);

document.addEventListener("DOMContentLoaded", () => {
  setupEditorPreview(document);
  setupArticleToc(document);
});

document.body.addEventListener("htmx:load", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement) {
    setupEditorPreview(target);
    setupArticleToc(target);
    return;
  }

  setupEditorPreview(document);
  setupArticleToc(document);
});

document.body.addEventListener("htmx:afterSwap", () => {
  setupEditorPreview(document);
  setupArticleToc(document);
});
