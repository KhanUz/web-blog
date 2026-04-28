import type { ArticleDocument } from "../../models/Article.js";
import { escapeHtml } from "../core/shell.js";
import { renderEditorForm } from "../components/forms.js";

export function renderEditorPage(article: ArticleDocument | null, initialMarkdown: string): string {
  return `
    <section class="space-y-8">
      <header>
        <p class="eyebrow">Content editing</p>
        <h2 class="page-title">${escapeHtml(article ? "Edit article" : "Create article")}</h2>
      </header>

      ${renderEditorForm(article, initialMarkdown)}
    </section>
  `;
}
