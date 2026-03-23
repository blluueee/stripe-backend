import * as amqp from "amqplib";

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;
let connecting: Promise<amqp.Channel> | null = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const RECONNECT_DELAY = 5000;

const connect = async (): Promise<amqp.Channel> => {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    while (!channel) {
      try {
        connection = await amqp.connect(RABBITMQ_URL);

        connection.on("error", (err) => {
          console.error("RabbitMQ connection error:", err);
          connection = null;
          channel = null;
        });

        connection.on("close", () => {
          console.warn("RabbitMQ connection closed");
          connection = null;
          channel = null;
        });

        channel = await connection.createChannel();
        console.log("✅ RabbitMQ connected");
      } catch (err) {
        console.error("RabbitMQ connect failed, retrying in 5s:", err);
        await new Promise((res) => setTimeout(res, RECONNECT_DELAY));
      }
    }

    connecting = null;
    return channel!;
  })();

  return connecting;
};

export const getChannel = connect;

export const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log("RabbitMQ connection closed");
  } catch (err) {
    console.error("Error closing RabbitMQ connection:", err);
  }
};

process.on("SIGINT", async () => {
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeConnection();
  process.exit(0);
});
