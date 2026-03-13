import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { escape } from "node:querystring";

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRETKEY!,
    );
  } catch (err) {
    console.log("Webhook signature failed");
    return res.sendStatus(400);
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object
      console.log("CHeckout completed", session.id);
      const discountAmount = session.total_details?.amount_discount ?? 0

      if(discountAmount>0) {
        console.log("Discount applied successfully, with amount:", discountAmount);
      } else { console.log("No discount applied");
      }
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      console.log("Payment successfull", paymentIntent.id)
      break;

    case "invoice.payment_succeeded":
      const invoice = event.data.object
      console.log("Subscription payment success", invoice.id);
      break;
  }

  res.json({ received: true})
};
