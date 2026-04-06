import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser"
import routes from "./routes";
import { CONFIG } from "./config/envConfig";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", routes);

app.listen(CONFIG.PORT, () => {
  console.log(`Ai Symptom Checker Service is running on port ${CONFIG.PORT}`);
});
