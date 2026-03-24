import express from "express";
import dotenv from "dotenv";
import paymentRoutes from "./routes/pay.route";
import { stripeWebhook } from "./webhooks/stripe.webhook";
import { connectDB } from "./db/db";
import { Response } from "express";
import { Request } from "./types/request";
import { startQueueWorkers } from "./queues";

dotenv.config();

const app = express();
// connectDB();
// startQueueWorkers().catch((err) =>
//   console.error("Queue workers failed to start:", err),
// );
app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json());
app.use("/payments", paymentRoutes);
app.get("/success", (req: Request, res: Response) => {
  res.json({ message: "payment successful" });
});
app.get("/failed", (req: Request, res: Response) => {
  res.send("payment failed");
});

const PORT = process.env.PORT 
if(!PORT) {
  throw new Error("Port is not defined")
}
const startServer = async () => {
  try {
    await connectDB();
    await startQueueWorkers();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
};

startServer();
