import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { handleStripeWebhookController } from "./controller/paymentController.js";
import { CONFIG } from "./config/envConfig.js";
import connectDB from "./config/db.js";
import { errorConverter, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();

const ENV = process.env.ENV || "local";

if (ENV === "local") {
  dotenv.config({ path: `.env.${ENV}`, override: true });
}

const app = express();

connectDB();

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhookController
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorConverter);
app.use(errorHandler);

app.listen(CONFIG.PORT, () => {
  console.log(`Payment Service is running on port ${CONFIG.PORT}`);
});
