import { getChannel } from "./connection";

export const publishPaymentFailureJob = async (data: any) => {
  const channel = await getChannel();

  const queue = "payment_failures";

  await channel.assertQueue(queue, { durable: true });

  channel.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  console.log("📤 Job sent to queue:", data);
};