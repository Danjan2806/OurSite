import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import sitesRouter from "./sites";
import adminRouter from "./admin";
import storageRouter from "./storage";
import billingRouter from "./billing";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(sitesRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(billingRouter);
router.use(aiRouter);

export default router;
