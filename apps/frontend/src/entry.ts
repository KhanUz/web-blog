import "./styles/global.css";
import { marked } from "marked";

type PreviewScope = ParentNode;

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

function setupEditorPreview(scope: PreviewScope): void {
  const shells = scope.querySelectorAll<HTMLElement>("[data-editor-shell]");

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

setupEditorPreview(document);

document.addEventListener("DOMContentLoaded", () => {
  setupEditorPreview(document);
});

document.body.addEventListener("htmx:afterSwap", (event) => {
  const target = (event as CustomEvent).detail?.target;

  if (target instanceof HTMLElement) {
    setupEditorPreview(target);
    return;
  }

  setupEditorPreview(document);
});
