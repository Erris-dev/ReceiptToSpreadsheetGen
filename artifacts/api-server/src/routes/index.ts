import { Router, type IRouter } from "express";
import healthRouter from "./health";
import parseReceiptRouter from "./parse-receipt";

const router: IRouter = Router();

router.use(healthRouter);
router.use(parseReceiptRouter);

export default router;
