import { createServer } from "./app.js";
import { config } from "./env.js";

createServer().then((app) => {
  app.listen(config.PORT, () => {
    console.log(`Server listening on http://localhost:${config.PORT}`);
  });
});