import express from 'express'
import dotenv from "dotenv";
dotenv.config();

const ENV = process.env.ENV || "local";

if (ENV == "local") {
  dotenv.config({ path: `.env.${ENV}`, override: true });
}

import routes from "./routes";
import { CONFIG } from "./config/envConfig";
import connectDB from "./config/db";
import { errorConverter, errorHandler } from "./middlewares/errorMiddleware";

const app = express();

connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorConverter);
app.use(errorHandler);

app.listen(CONFIG.PORT, () => {
  console.log(`Patient Management Service is running on port ${CONFIG.PORT}`);
});
