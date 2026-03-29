import express from "express";
import "dotenv/config";
import routes from "./routes";
import { CONFIG } from "./config/envConfig";

const app = express();

app.use("/", routes);

app.listen(CONFIG.PORT, () => {
  console.log(`Payment Service is running on port ${CONFIG.PORT}`);
});
