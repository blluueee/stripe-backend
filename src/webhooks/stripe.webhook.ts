import { Response } from "express";
import { Request } from "../types/request";
import { stripe } from "../config/stripe";
import { generateInvoice } from "../services/invoice.service";
import Subscription from "../models/Subscription";
import User from "../models/User";
import Stripe from "stripe";
import { Types } from "mongoose";
import { publishPaymentFailureJob } from "../queues/publisher";

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    console.log("🔔 Webhook received!");
    console.log("Signature:", signature?.substring(0, 20) + "...");

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_KEY!,
    );
    console.log("✅ Event verified:", event.type);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        if (!userId) {
          console.error("No userId found in checkout session metadata");
          break;
        }

        const stripeSubscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const price = stripeSubscription.items.data[0].price;

        const dbSubscription = await Subscription.findOneAndUpdate(
          { subscriptionId: stripeSubscription.id },
          {
            userId,
            stripeCustomerId,
            subscriptionId: stripeSubscription.id,
            priceId: price.id,
            productId: price.product as string
            status: stripeSubscription.status,
            trialStart: stripeSubscription.trial_start
              ? new Date(stripeSubscription.trial_start * 1000)
              : null,

            trialEnd: stripeSubscription.trial_end
              ? new Date(stripeSubscription.trial_end * 1000)
              : null,
            isTrial: !!stripeSubscription.trial_end,
            isTrialUsed: true,
          },
          { upsert: true, new: true },
        );

        await User.findByIdAndUpdate(userId, {
          stripeCustomerId,
          subscriptionId: dbSubscription._id,
          isTrialUsed: true
        });

        console.log("Subscription saved after checkout.session.completed");
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        await Subscription.findOneAndUpdate(
          { subscriptionId: sub.id },
          {
            status: sub.status as any,
            trialStart: sub.trial_start
              ? new Date(sub.trial_start * 1000)
              : null,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            isTrial: !!sub.trial_end,
          },
        );

        console.log("Subscription updated in DB");
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await Subscription.findOneAndUpdate(
          { subscriptionId: sub.id },
          { status: "canceled" },
        );

        console.log("Subscription canceled in DB");
        break;
      }

      case "payment_intent.succeeded":
        {
          const paymentIntent = event.data.object;
          console.log("Payment successful", paymentIntent.id);

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
          console.log("Invoice received", invoice.id);

          const subscription = invoice.subscription;
          const stripeSubscriptionId =
            typeof subscription === "string" ? subscription : subscription?.id;

          if (!stripeSubscriptionId) {
            throw new Error("Not a subscription invoice, skipping");
          }

          await Subscription.findOneAndUpdate(
            { subscriptionId: stripeSubscriptionId },
            { status: "active" },
          );
          console.log("✅ Subscription payment success:", invoice.subscription);
        }
        break;

      case "invoice.payment_failed":
        {
          const invoice = event.data.object as Record<string, any>;
          console.log("Subscription payment failed", invoice.id);

          await Subscription.findOneAndUpdate(
            { subscriptionId: invoice.subscription },
            { status: "past_due" },
          ); //this prevents cancelling immediately

          await publishPaymentFailureJob({
            invoiceId: invoice.id,
            customerId: invoice.customer,
            subscriptionId: invoice.subscription,
          });

          // w/out RabbitMQ
          // await Subscription.findOneAndUpdate(
          //   { subscriptionId: invoice.subscription as string },
          //   { status: "canceled" }
          // );
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return res.status(500).send("Webhook handler failed");
  }
};
