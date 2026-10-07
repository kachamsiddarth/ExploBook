import { app } from './app.js';
import { config } from './config/index.js';
import { getDatabase } from './database/index.js';
import { seedBookCatalogue } from './database/seed.js';

const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`[ExploBook API] Server running on port ${PORT} (${config.env})`);

  // Initialize MongoDB Atlas connection and auto-seed books if MONGODB_URI is configured
  if (config.mongodb?.uri) {
    try {
      await getDatabase();
      await seedBookCatalogue();
    } catch (err: any) {
      console.warn('[MongoDB/Seed Warning]: Could not initialize database on boot:', err.message);
    }
  } else {
    console.log('[MongoDB]: MONGODB_URI not configured. Running in lightweight mode.');
  }
});
