import app from "./app";
import { envConfig } from "./config/env.config";

const PORT = envConfig.APP_PORT || 3000;

app.listen(PORT, () => {
  console.log(`[BSO Authorization Server running on http://localhost:${PORT}]`);
});
