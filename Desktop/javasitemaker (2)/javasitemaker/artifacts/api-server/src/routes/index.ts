import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import sitesRouter from "./sites";
import adminRouter from "./admin";
import billingRouter from "./billing";
import aiRouter from "./ai";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(sitesRouter);
router.use(adminRouter);
router.use(billingRouter);
router.use(aiRouter);
router.use(storageRouter);

export default router;
