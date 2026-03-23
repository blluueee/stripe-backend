import User from "../models/User";
import { createCheckoutSession, createCustomer, cancelSubscription } from "../services/subscription.service";
import { Request } from "../types/request";
import { Response } from "express";

export const createCheckoutController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { priceId, promoCode } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // let customerId = user.stripeCustomerId;

    // if (!customerId) {
    //   const customer = await createCustomer(user.email);
    //   customerId = customer.id;

    //   user.stripeCustomerId = customerId;
    //   await user.save();
    // }

    const session = await createCheckoutSession(priceId, req, promoCode);
    res.json({ url: session.url });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Unable to create checkout session" });
  }
};


export const cancelSubscriptionController = async ( req: Request, res: Response)=> {
  try {
    const { immediate } = req.body
    const result = await cancelSubscription(req, immediate)
    res.json(result)
  } catch(error:any) {
    res.status(400).json({message: error.message})
  }
}