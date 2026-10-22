import "dotenv/config";
import { createServer } from "./app.js";

const PORT = Number(process.env.PORT) || 4000;

createServer().then((app) => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});