import { Router } from "express";
import { proxy } from "../utils/proxy";
import { CONFIG } from '../config/envConfig';

const router = Router();

router.use("/", proxy(CONFIG.PAYMENT_SERVICE_URL));

export default router;