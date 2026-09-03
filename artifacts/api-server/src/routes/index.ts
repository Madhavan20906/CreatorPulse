import { Router, type IRouter } from "express";
import healthRouter from "./health";
import creatorRouter from "./creator";

const router: IRouter = Router();

router.use(healthRouter);
router.use(creatorRouter);

export default router;
