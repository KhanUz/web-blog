import type { ProfileDocument } from "../../models/Profile.js";
import type { UserDocument } from "../../models/User.js";
import { renderAccountPanel, renderProfilePanel } from "../components/forms.js";
import { escapeHtml } from "../html.js";

export function renderAboutPage(profile: ProfileDocument | null, currentUser: UserDocument | null): string {
  return `
    <section class="space-y-8">
      <header>
        <p class="eyebrow">About / Account</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">About the publication and your account</h2>
      </header>

      <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        ${renderProfilePanel(profile)}
        ${renderAccountPanel(currentUser)}
      </div>

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
