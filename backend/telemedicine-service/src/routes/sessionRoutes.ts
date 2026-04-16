import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createSessionBodySchema,
  doctorIdParamSchema,
  endSessionBodySchema,
  paginationQuerySchema,
  sessionIdParamSchema,
} from "../validations/sessionSchemas";
import {
  createSession,
  endSession,
  getSession,
  getSessionStatus,
  getSessionToken,
  getSummary,
  joinSession,
  listDoctorSessions,
  postStartSession,
} from "../controller/sessionController";

const router = Router();

router.use(requireAuth);

router.post(
  "/create",
  validate({ body: createSessionBodySchema }),
  createSession,
);

router.get(
  "/:id/token",
  validate({ params: sessionIdParamSchema }),
  getSessionToken,
);

router.post(
  "/:id/start",
  validate({ params: sessionIdParamSchema }),
  postStartSession,
);

router.get(
  "/:id/status",
  validate({ params: sessionIdParamSchema }),
  getSessionStatus,
);

router.post(
  "/:id/join",
  validate({ params: sessionIdParamSchema }),
  joinSession,
);

router.get(
  "/doctor/:doctorId",
  validate({ params: doctorIdParamSchema, query: paginationQuerySchema }),
  listDoctorSessions,
);

router.get(
  "/:id/summary",
  validate({ params: sessionIdParamSchema }),
  getSummary,
);

router.patch(
  "/:id/end",
  validate({ params: sessionIdParamSchema, body: endSessionBodySchema }),
  endSession,
);

router.get("/:id", validate({ params: sessionIdParamSchema }), getSession);

export default router;
