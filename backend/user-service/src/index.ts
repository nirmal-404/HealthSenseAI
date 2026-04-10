import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { CONFIG } from "./config/envConfig";
import connectDB from "./config/db";
import { errorConverter, errorHandler } from "./middlewares/errorMiddleware";

const app = express();

console.log(CONFIG);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", routes);

app.use(errorConverter);

app.use(errorHandler);

app.listen(CONFIG.PORT, () => {
  console.log(`User Service is running on port ${CONFIG.PORT}`);
});
