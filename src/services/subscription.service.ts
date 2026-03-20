import { stripe } from "../config/stripe";
import Subscription from "../models/Subscription";
// cspell:ignore promocode
import User, { IUser } from "../models/User";
import { Request } from "../types/request";
import { findActivePromotionCode } from "./promocode.service";

export const createCheckoutSession = async (
  priceId: string,
  req: Request,
  promoCode?: string,
) => {
  let discounts;

  if (promoCode) {
    const promo = await findActivePromotionCode(promoCode);
    if (!promo) {
      throw new Error("Invalid or inactive promotion code");
    }
    discounts = [{ promotion_code: promo.id }];
  }

  if (!req.user) {
    throw new Error("User not authenticated");
  }
  const user = req.user as IUser;

  const existing = await Subscription.findOne({ userId: user._id });
  if (existing?.isTrialUsed) {
    throw new Error("Free trial already used");
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    console.log("🆕 Creating Stripe customer...");

    const customer = await stripe.customers.create({
      email: user.email,
    });

    stripeCustomerId = customer.id;
    await User.findByIdAndUpdate(user._id, {
      stripeCustomerId: stripeCustomerId,
    });

    console.log("Stripe customer created:", stripeCustomerId);
  } else {
    console.log("Reusing existing Stripe customer:", stripeCustomerId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    customer_email: user.email,
    payment_method_types: ["card"],
    subscription_data: {
      trial_period_days: 7,
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
    },
    metadata: { userId: user._id.toString() },
    line_items: [{ price: priceId, quantity: 1 }],
    discounts,
    // allow_promotion_codes: !promoCode,

    success_url:
      "http://localhost:5000/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:5000/cancel",
  });
  return session;
};

export const createCustomer = async (email: string) => {
  return await stripe.customers.create({
    email: email,
  });
};
