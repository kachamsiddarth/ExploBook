import { app } from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[ExploBook API] Server running on port ${PORT} (${config.env})`);
});
