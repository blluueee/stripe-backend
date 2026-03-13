import express from "express"
import { login, register } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { createCheckoutController } from "../controllers/subscription.controller";
import { createOneTimePaymentController } from "../controllers/payment.controller";

const router = express.Router()
router.post("/register", register);
router.post("/login", login);
// router.post("/customer", createCustomerController)
router.post("/subscription", authMiddleware, createCheckoutController)
router.post("/one-time-purchase", authMiddleware, createOneTimePaymentController)
// router.post("/payment-method", attachPaymentMethodController)

export default router