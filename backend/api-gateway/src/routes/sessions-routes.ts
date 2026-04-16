import { Router } from "express";
import { CONFIG } from "../config/envConfig";
import { proxyWithPathRewrite } from "../utils/proxy";

const router = Router();

/**
 * /api/sessions* → telemedicine service /sessions*
 */
router.use(
  "/",
  proxyWithPathRewrite(CONFIG.TELEMEDICINE_SERVICE_URL, (path, req) => {
    // path is the full request path (e.g., /api/sessions/create)
    // req.baseUrl is the mount point (e.g., /api/sessions)
    const prefix = (req as any).baseUrl || "";
    const suffix = path.replace(new RegExp(`^${prefix}`), "") || "/";
    const target = "/sessions" + (suffix === "/" ? "" : suffix);
    return target;
  }),
);

export default router;
