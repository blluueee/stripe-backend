import { stripe } from "../config/stripe";
import { findActivePromotionCode } from "./promocode.service";

export const createOneTimePaymentSession = async (amount: number, customerId: string, userId: string, promoCode?: string) => { 
  let discounts

  if(promoCode) {
    const promo = await findActivePromotionCode(promoCode)
    if(!promo){ throw new Error("Invalid or inactive promotion code") }

    discounts = [{ promotion_code : promo.id}]
  }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
            price_data: { currency: "usd", 
            product_data: { name: "One Time Payment"},
            unit_amount: Math.round(amount*100)
            }, quantity: 1
        }],
        discounts,
        // allow_promotion_codes: !promoCode,
        // allow_promotion_codes: true,
        success_url: "http://localhost:5000/success",
        cancel_url: "http://localhost:5000/failed",

        metadata: { userId },
        payment_intent_data: { metadata: {userId}}
    })
    console.log("checkout session created --  >")
    return session
}

export const createCustomer = async (email: string) => {
  return await stripe.customers.create({
    email: email
  });
};