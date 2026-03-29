import { Router } from "express";
import { proxy } from "../utils/proxy";
import { CONFIG } from '../config/envConfig';

const router = Router();

router.use("/", proxy(CONFIG.AI_SYMPTOM_CHECKER_SERVICE_URL));

export default router;