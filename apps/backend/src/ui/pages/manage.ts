import type { ArticleDocument } from "../../models/Article.js";
import { renderManageTable } from "../components/forms.js";

export function renderManagePage(articles: ArticleDocument[]): string {
  return `
    <section class="space-y-8">
      <header class="page-header">
        <div>
          <p class="eyebrow">Owner workspace</p>
          <h2 class="page-title">
            Publish, revise, and organize your writing from one place.
          </h2>
        </div>
        <a class="nav-chip" href="/editor">Create new article</a>
      </header>

      ${renderManageTable(articles)}
    </section>
  `;
}
