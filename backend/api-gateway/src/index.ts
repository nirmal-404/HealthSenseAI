import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import {limiter} from './middlewares/rate-limit-redis'
import routes from "./routes";
import { CONFIG } from './config/envConfig';


const app = express();

app.use(cors());

app.use(express.json());

app.use(limiter)

app.use("/api", routes);

app.listen(CONFIG.PORT, () => {
  console.log(`API Gateway running on port ${CONFIG.PORT}`);
});