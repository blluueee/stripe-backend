import mongoose, { ObjectId, Schema, Types } from "mongoose";

export interface IUser {
  _id: ObjectId;
  email: string;
  password: string;
  stripeCustomerId: string;
  subscriptionId: ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      unique: true,
      required: true,
    },
    stripeCustomerId: {
      type: String,
    },
    subscriptionId: {
      type: Types.ObjectId,
      ref: "Subscription",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IUser>("User", userSchema);

// price id for one-time: price_1T8FAXCCorgN3Hk03Jg4a5B3
// price id for rcurring: price_1T8EtECCorgN3Hk0GiQLTnz8