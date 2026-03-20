import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to MongoDB");

  try {
    const user = await User.create({
      email: "test_" + Date.now() + "@example.com",
      password: "password123",
    });
    console.log("User created:", user._id);

    // attempt to update
    const updated = await User.findByIdAndUpdate(
      user._id,
      {
        stripeCustomerId: "cus_123",
        subscriptionId: new mongoose.Types.ObjectId(),
      },
      { new: true },
    );
    console.log("User updated:", updated);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
