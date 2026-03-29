import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;