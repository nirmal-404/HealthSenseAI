import express from 'express'
import cors from 'cors'
import dotenv from "dotenv";
dotenv.config();

const ENV = process.env.ENV || "local";

if (ENV == "local") {
  dotenv.config({ path: `.env.${ENV}`, override: true });
}

import { limiter } from './middlewares/rate-limit-redis'
import routes from "./routes";
import { CONFIG } from './config/envConfig';
import { optionalAuth } from './middlewares/auth';

const app = express();

app.use(cors());

app.use(express.json());

// app.use(limiter)

app.use("/api", optionalAuth, routes);

app.listen(CONFIG.PORT, () => {
  console.log(`API Gateway running on port ${CONFIG.PORT}`);
});