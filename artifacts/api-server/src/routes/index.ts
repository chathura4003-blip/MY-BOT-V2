import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import sessionsRouter from "./sessions";
import broadcastRouter from "./broadcast";
import settingsRouter from "./settings";
import logsRouter from "./logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(sessionsRouter);
router.use(broadcastRouter);
router.use(settingsRouter);
router.use(logsRouter);

export default router;
