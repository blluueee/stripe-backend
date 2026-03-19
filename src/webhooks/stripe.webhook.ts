import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { generateInvoice } from "../services/invoice.service";
import Subscription from "../models/Subscription";
import User from "../models/User";
import Stripe from "stripe";
import { Types } from "mongoose";

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRETKEY!,
    );

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("CHeckout completed", session.id);
        const discountAmount = session.total_details?.amount_discount ?? 0;

        if (discountAmount > 0) {
          console.log(
            "Discount applied successfully, with amount:",
            discountAmount,
          );
        } else {
          console.log("No discount applied");
        }

        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.userId;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          const savedSub = await Subscription.findOneAndUpdate(
            { subscriptionId: subscription.id },
            {
              userId: new Types.ObjectId(userId),
              stripeCustomerId: customerId,
              subscriptionId: subscription.id,
              status: subscription.status,
              trialStart: subscription.trial_start
                ? new Date(subscription.trial_start * 1000)
                : null,
              trialEnd: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              isTrial: subscription.status === "trialing",
              isTrialUsed: true,
            },
            { upsert: true, new: true },
          );
          await User.findByIdAndUpdate(userId, {
            currentSubscriptionId: savedSub._id,
          });
        }

        break;

      case "payment_intent.succeeded":
        {
          const paymentIntent = event.data.object;
          console.log("Payment successfull", paymentIntent.id);

          await generateInvoice(
            paymentIntent.customer as string,
            paymentIntent.amount,
            "Product purchase",
          );
        }
        break;

      case "invoice.payment_succeeded":
        {
          const invoice = event.data.object as Record<string, any>;
          console.log("Subscription payment success", invoice.id);

          const subscription = invoice.subscription;
          const stripeSubscriptionId =
            typeof subscription === "string" ? subscription : subscription?.id;

          if (!stripeSubscriptionId) {
            throw new Error("No subscription found in invoice");
          }

          await Subscription.findOneAndUpdate(
            { subscriptionId: stripeSubscriptionId },
            { status: "active" },
          );
        }
        break;

      case "invoice.payment_failed":
        {
          const invoice = event.data.object as Record<string, any>;
          console.log("Subscription payment failed", invoice.id);

          await Subscription.findOneAndUpdate(
            { subscriptionId: invoice.subscription as string },
            { status: "canceled" },
          );
        }
        break;

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // if(subscription.status === "trialing"){
        //   console.log("User is on free trial");
        // }
        await Subscription.findOneAndUpdate(
          {
            subscriptionId: subscription.id,
          },
          {
            status: subscription.status,
            trialStart: subscription.trial_start
              ? new Date(subscription.trial_start * 1000)
              : null,
            trialEnd: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            isTrial: subscription.status === "trialing",
            isTrialUsed: true,
          },
        );
        break;
      }
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object;

          await Subscription.findOneAndUpdate(
            { subscriptionId: subscription.id },
            { status: "canceled", isTrial: false },
          );
        }
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.log("Webhook signature failed", err);
    return res.sendStatus(400);
  }
};
