import { stripe } from "../config/stripe"

export const findActivePromotionCode = async (code: string) => {
  const result = await stripe.promotionCodes.list({ code, active: true, limit: 1})
  return result.data[0] ?? null
}



// WELCOME10-Perc: Once, only for first time purchase users
// SUMMER20-Perc: 3 motnhs, Require min order value(10$)
// VIP50-Perc: forever, for specific user only(user9@test.com)
// SHEIN03-Amt: 3$, 1 month, inside Redemption limits-total no. of times coupon can be redeemed(30 times, This limit applies across customers so it won't prevent a single customer from redeeming multiple times.)
//  No. of times code can be redeemed(3 times)