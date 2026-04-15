import { Router } from "express";
import { CONFIG } from "../config/envConfig";
import { proxyWithPathRewrite } from "../utils/proxy";

const router = Router();

/**
 * /api/sessions* → telemedicine service /sessions*
 */
router.use(
  "/",
  proxyWithPathRewrite(CONFIG.TELEMEDICINE_SERVICE_URL, (path) => {
    const [pathname, query] = path.split("?");
    const suffix =
      pathname === "/" || pathname === "" ? "" : pathname;
    const target = "/sessions" + suffix;
    return query ? `${target}?${query}` : target;
  }),
);

export default router;
