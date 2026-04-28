import type { ProfileDocument } from "../../models/Profile.js";
import { renderProfilePanel } from "../components/forms.js";
import { escapeHtml } from "../core/shell.js";

export function renderAboutPage(profile: ProfileDocument | null): string {
  return `
    <section class="space-y-8">
      <header>
        <p class="eyebrow">About</p>
        <h2 class="page-title">About the publication</h2>
      </header>

      ${renderProfilePanel(profile)}

      <section class="panel p-6 sm:p-8">
        <p class="eyebrow">Topics</p>
        <div class="article-copy">
          <ul>
            ${
              profile && profile.topics.length > 0
                ? profile.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")
                : "<li>No topics configured.</li>"
            }
          </ul>
        </div>
      </section>
    </section>
  `;
}
