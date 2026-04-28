import type { ArticleDocument } from "../../models/Article.js";
import { escapeHtml } from "../html.js";
import { renderEditorForm } from "../components/forms.js";

export function renderEditorPage(article: ArticleDocument | null, initialMarkdown: string): string {
  return `
    <section class="space-y-8">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Content editing</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">${escapeHtml(article ? "Edit article" : "Create article")}</h2>
        </div>
      </header>

      ${renderEditorForm(article, initialMarkdown)}
    </section>
  `;
}
