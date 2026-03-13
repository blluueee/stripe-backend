import User from "../models/User";
import { createOneTimePaymentSession, createCustomer } from "../services/payment.service";
import { Request } from "../types/request";
import { Response } from "express";

export const createOneTimePaymentController = async (req: Request, res: Response) => {
  try {
    const { amount, promoCode } = req.body
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await createCustomer(user.email);
      customerId = customer.id;  

      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await createOneTimePaymentSession(amount, customerId, user._id.toString(), promoCode);
    res.json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Unable to create checkout session" });
  }
};
