import { Router } from "express";
import { CONFIG } from "../config/envConfig";
import { proxyWithPathRewrite } from "../utils/proxy";

const router = Router();

/**
 * /api/prescriptions* → doctor-management /prescriptions*
 */
router.use(
  "/",
  proxyWithPathRewrite(CONFIG.DOCTOR_MANAGEMENT_SERVICE_URL, (path) => {
    const [pathname, query] = path.split("?");
    const suffix =
      pathname === "/" || pathname === "" ? "" : pathname;
    const target = "/prescriptions" + suffix;
    return query ? `${target}?${query}` : target;
  }),
);

export default router;
