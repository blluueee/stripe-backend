import { startPaymentFailureConsumer } from "./consumer";

export const startQueueWorkers = async () => {
  await startPaymentFailureConsumer();
};