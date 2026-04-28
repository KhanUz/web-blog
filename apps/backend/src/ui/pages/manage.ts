import type { ArticleDocument } from "../../models/Article.js";
import { renderManageTable } from "../components/forms.js";

export function renderManagePage(articles: ArticleDocument[]): string {
  return `
    <section class="space-y-8">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Owner workspace</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">
            Publish, revise, and organize your writing from one place.
          </h2>
        </div>
        <a class="nav-chip" href="/editor">Create new article</a>
      </header>

      ${renderManageTable(articles)}
    </section>
  `;
}
