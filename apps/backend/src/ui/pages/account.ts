import type { UserDocument } from "../../models/User.js";
import { renderAccountPanel, type AccountGuestMode } from "../components/forms.js";

export function renderAccountPage(currentUser: UserDocument | null, guestMode: AccountGuestMode = "login"): string {
  const isSignedIn = currentUser !== null;

  return `
    <section class="space-y-8">
      <header>
        <p class="eyebrow">${isSignedIn ? "Account" : "Sign in"}</p>
        <h2 class="page-title">${isSignedIn ? "Manage your account" : "Sign in or create an account"}</h2>
      </header>

      ${renderAccountPanel(currentUser, guestMode)}
    </section>
  `;
}
