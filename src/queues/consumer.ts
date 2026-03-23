import { getChannel } from "./connection";

export const startPaymentFailureConsumer = async () => {
  const channel = await getChannel();

  const queue = "payment_failures";

  await channel.assertQueue(queue, { durable: true });

  channel.prefetch(5);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());

      console.log("📥 Processing job:", data);

      channel.ack(msg);
    } catch (error) {
      console.error("❌ Consumer error:", error);

      // disable requeueing to prevent poison message loops
      channel.nack(msg, false, true);
    }
  });

  console.log("🚀 Consumer started");
};