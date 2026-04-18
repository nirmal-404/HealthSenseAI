import amqp from "amqplib";
import { CONFIG } from "../config/envConfig";
import { EventHandler } from "../types/EventHandler";

/**
 * RabbitMQ Service - Handles event-driven communication
 * Connects to RabbitMQ, declares exchanges/queues, and consumes events
 */
class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private eventHandlers: Map<string, EventHandler> = new Map();
  private isConnected: boolean = false;
  private retryCount: number = 0;

  /**
   * Connect to RabbitMQ with retry logic
   */
  async connect(): Promise<void> {
    try {
      console.log(
        `🔗 Connecting to RabbitMQ: ${CONFIG.RABBITMQ_URL}`
      );

      this.connection = await amqp.connect(CONFIG.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Set up connection event handlers
      this.connection.on("error", (err: any) => {
        console.error("❌ RabbitMQ Connection Error:", err);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on("close", () => {
        console.warn("⚠️  RabbitMQ Connection Closed");
        this.isConnected = false;
      });

      this.channel.on("error", (err: any) => {
        console.error("❌ RabbitMQ Channel Error:", err);
      });

      this.isConnected = true;
      this.retryCount = 0;

      console.log("✅ Connected to RabbitMQ");

      // Declare exchanges and queues
      await this.declareExchangesAndQueues();

      // Start consuming events
      await this.startConsuming();
    } catch (error: any) {
      console.error("❌ Failed to connect to RabbitMQ:", error?.message);
      this.isConnected = false;
      this.reconnect();
    }
  }

  /**
   * Reconnect to RabbitMQ with exponential backoff
   */
  private async reconnect(): Promise<void> {
    if (this.retryCount >= CONFIG.RABBITMQ_CONNECTION_MAX_RETRIES) {
      console.error("❌ Max RabbitMQ reconnection attempts reached");
      return;
    }

    this.retryCount++;
    const delay =
      CONFIG.RABBITMQ_CONNECTION_RETRY_DELAY *
      Math.pow(1.5, this.retryCount - 1);

    console.log(
      `⏳ Retrying RabbitMQ connection in ${delay}ms (Attempt ${this.retryCount}/${CONFIG.RABBITMQ_CONNECTION_MAX_RETRIES})`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Declare RabbitMQ exchanges and queues
   */
  private async declareExchangesAndQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      // Declare appointment exchange and queue
      await this.channel.assertExchange(
        CONFIG.APPOINTMENT_EXCHANGE,
        "topic",
        { durable: true }
      );
      await this.channel.assertQueue(CONFIG.APPOINTMENT_QUEUE, {
        durable: true,
      });
      // Bind with wildcard to receive all appointment events
      await this.channel.bindQueue(
        CONFIG.APPOINTMENT_QUEUE,
        CONFIG.APPOINTMENT_EXCHANGE,
        "appointment.*"
      );

      console.log(
        `✓ Declared appointment exchange: ${CONFIG.APPOINTMENT_EXCHANGE}`
      );
      console.log(
        `✓ Declared appointment queue: ${CONFIG.APPOINTMENT_QUEUE}`
      );
      console.log(
        `✓ Queue bound to exchange with pattern: appointment.*`
      );

      // Declare consultation exchange and queue
      await this.channel.assertExchange(
        CONFIG.CONSULTATION_EXCHANGE,
        "topic",
        { durable: true }
      );
      await this.channel.assertQueue(CONFIG.CONSULTATION_QUEUE, {
        durable: true,
      });
      await this.channel.bindQueue(
        CONFIG.CONSULTATION_QUEUE,
        CONFIG.CONSULTATION_EXCHANGE,
        CONFIG.CONSULTATION_ROUTING_KEY
      );

      console.log(
        `✓ Declared consultation exchange: ${CONFIG.CONSULTATION_EXCHANGE}`
      );
      console.log(
        `✓ Declared consultation queue: ${CONFIG.CONSULTATION_QUEUE}`
      );
    } catch (error: any) {
      console.error("Error declaring exchanges/queues:", error?.message);
      throw error;
    }
  }

  /**
   * Register an event handler for a specific event type
   */
  registerEventHandler(eventType: string, handler: EventHandler): void {
    this.eventHandlers.set(eventType, handler);
    console.log(`✓ Registered event handler for: ${eventType}`);
  }

  /**
   * Start consuming events from queues
   */
  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      // Consume from appointment queue
      await this.channel.consume(
        CONFIG.APPOINTMENT_QUEUE,
        (msg: any) => {
          if (msg) {
            // Extract routing key from message properties
            const routingKey = msg.fields.routingKey || "appointment.booked";
            this.handleMessage(msg, routingKey);
          }
        },
        { noAck: false }
      );

      console.log(`✓ Started consuming from queue: ${CONFIG.APPOINTMENT_QUEUE}`);

      // Consume from consultation queue
      await this.channel.consume(
        CONFIG.CONSULTATION_QUEUE,
        (msg: any) => {
          if (msg) {
            this.handleMessage(msg, "consultation.completed");
          }
        },
        { noAck: false }
      );

      console.log(
        `✓ Started consuming from queue: ${CONFIG.CONSULTATION_QUEUE}`
      );
    } catch (error: any) {
      console.error("Error starting consumers:", error?.message);
      throw error;
    }
  }

  /**
   * Handle incoming messages from RabbitMQ
   */
  private async handleMessage(
    msg: any,
    eventType: string
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const message = JSON.parse(content);
      
      const appointmentId = message.data?.appointmentId || 'UNKNOWN';

      console.log(`
📨 [RabbitMQ MESSAGE RECEIVED]
   - eventType: ${eventType}
   - appointmentId: ${appointmentId}
   - messageId: ${msg.properties.messageId}
   - timestamp: ${Date.now()}`);

      // Extract the actual event data from the message wrapper
      const eventData = message.data || message;

      // Get the handler for this event type
      const handler = this.eventHandlers.get(eventType);

      if (!handler) {
        console.warn(`⚠️  No handler registered for event: ${eventType}`);
        // Acknowledge the message anyway to avoid requeue
        if (this.channel) {
          this.channel.ack(msg);
        }
        return;
      }

      // Execute the event handler
      await handler(eventData);

      // Acknowledge the message after successful processing
      if (this.channel) {
        this.channel.ack(msg);
      }

      console.log(`✅ [MESSAGE ACK'D] Event processed: ${eventType}`);
    } catch (error: any) {
      console.error(
        `❌ Error processing message for event ${eventType}:`,
        error?.message
      );

      // Nack the message to requeue it
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Publish a message to an exchange
   */
  async publishEvent(
    exchange: string,
    routingKey: string,
    message: any,
    options?: any
  ): Promise<boolean> {
    if (!this.channel) {
      console.error("Channel not initialized, cannot publish event");
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: true,
        contentType: "application/json",
        ...options,
      };

      const result = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        publishOptions
      );

      if (result) {
        console.log(
          `✓ Published event to ${exchange}/${routingKey}`
        );
      } else {
        console.warn(
          `⚠️  Failed to publish event to ${exchange}/${routingKey}`
        );
      }

      return result;
    } catch (error: any) {
      console.error("Error publishing event:", error?.message);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Gracefully close RabbitMQ connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log("✓ RabbitMQ connection closed");
    } catch (error: any) {
      console.error("Error closing RabbitMQ connection:", error?.message);
    }
  }
}

export default new RabbitMQService();
