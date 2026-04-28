import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase } from "./lib/db/connectToDatabase.js";
import { seedDatabase } from "./lib/db/seedData.js";

async function startServer() {
  await connectToDatabase();
  await seedDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
