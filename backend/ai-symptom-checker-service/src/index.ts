import express from "express";
import "dotenv/config";
import routes from "./routes";
import { CONFIG } from "./config/envConfig";

const app = express();

app.use("/", routes);

app.listen(CONFIG.PORT, () => {
  console.log(`Ai Symptom Checker Service is running on port ${CONFIG.PORT}`);
});
