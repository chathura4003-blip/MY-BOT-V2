import { Router, type IRouter, type Response } from "express";
import { authMiddleware, type AdminRequest } from "../middlewares/auth";
import { appState } from "../state";

const router: IRouter = Router();

router.get("/logs", authMiddleware, (_req: AdminRequest, res: Response) => {
  res.json(appState.getLogs());
});

export default router;
