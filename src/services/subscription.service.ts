import { stripe } from "../config/stripe";
import { findActivePromotionCode } from "./promocode.service";

export const createCheckoutSession = async (customerId:string, priceId:string, userId:string, promoCode?:string) => { 
  let discounts

  if(promoCode) {
    const promo = await findActivePromotionCode(promoCode)
    if(!promo){
      throw new Error ("Invalid or inactive promotion code")
    }
    discounts = [{promotion_code: promo.id}]
  }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types:  ["card"],
        line_items: [{price: priceId, quantity: 1}],
        discounts, 
        // allow_promotion_codes: !promoCode,

        success_url: "http://localhost:5000/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5000/cancel",

        metadata: { userId },
        subscription_data: { metadata: {userId}}
    })
    return session
}

export const createCustomer = async (email: string) => {
  return await stripe.customers.create({
    email: email
  });
};