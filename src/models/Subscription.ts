import mongoose, { Schema, ObjectId, Types } from "mongoose";

export interface ISubscription {
  userId: Types.ObjectId,
  stripeCustomerId: string,
  subscriptionId: string,

  status: "active" | "trialing" | "canceled",

  trialStart: Date,
  trialEnd: Date,
  isTrial: boolean,
  isTrialUsed: boolean
}

const SubscriptionSchema = new Schema<ISubscription>({
    userId: {
        type: Types.ObjectId, ref: "User", required: true
    },
    stripeCustomerId: {
        type: String
    },
    subscriptionId: {
        type: String
    },
    status: {
        type: String, enum: ["active", "trialing", "canceled"]
    },
    trialStart: {
        type: Date
    },
    trialEnd: {
        type: Date
    },
    isTrial: {
        type: Boolean
    },
    isTrialUsed: {
        type: Boolean
    }
},
{
    timestamps: true
})

export default mongoose.model<ISubscription>("Subscription", SubscriptionSchema)

// price id for one-time: price_1T8FAXCCorgN3Hk03Jg4a5B3
// price id for rcurring: price_1T8EtECCorgN3Hk0GiQLTnz8