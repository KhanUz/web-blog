import "../styles/global.css";

import { loadSession } from "./core/http";
import { syncChrome } from "./core/chrome";
import { registerEventHandlers } from "./features/events";
import { showPage } from "./features/actions";

export async function bootstrapApp(): Promise<void> {
  registerEventHandlers();
  await loadSession();
  syncChrome();
  await showPage("home");
}
