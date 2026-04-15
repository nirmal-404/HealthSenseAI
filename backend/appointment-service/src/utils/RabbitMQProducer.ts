import amqp from "amqplib";
import { CONFIG } from "../config/envConfig";

/**
 * RabbitMQ Producer Service - Publishes appointment events
 * Used by Appointment Service to send async messages to other services
 */
class RabbitMQProducer {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;
  private retryCount: number = 0;

  /**
   * Connect to RabbitMQ with retry logic
   */
  async connect(): Promise<void> {
    try {
      console.log(`🔗 Producer: Connecting to RabbitMQ: ${CONFIG.RABBITMQ_URL}`);

      this.connection = await amqp.connect(CONFIG.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Set up connection event handlers
      this.connection.on("error", (err: any) => {
        console.error(" Producer: RabbitMQ Connection Error:", err);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on("close", () => {
        console.warn("  Producer: RabbitMQ Connection Closed");
        this.isConnected = false;
      });

      this.channel.on("error", (err: any) => {
        console.error(" Producer: RabbitMQ Channel Error:", err);
      });

      this.isConnected = true;
      this.retryCount = 0;

      console.log("✅ Producer: Connected to RabbitMQ");

      // Declare exchanges
      await this.declareExchanges();
    } catch (error: any) {
      console.error(" Producer: Failed to connect to RabbitMQ:", error?.message);
      this.isConnected = false;
      this.reconnect();
    }
  }

  /**
   * Reconnect to RabbitMQ with exponential backoff
   */
  private async reconnect(): Promise<void> {
    if (this.retryCount >= CONFIG.RABBITMQ_CONNECTION_MAX_RETRIES) {
      console.error(" Producer: Max RabbitMQ reconnection attempts reached");
      return;
    }

    this.retryCount++;
    const delay =
      CONFIG.RABBITMQ_CONNECTION_RETRY_DELAY *
      Math.pow(1.5, this.retryCount - 1);

    console.log(
      `⏳ Producer: Retrying RabbitMQ connection in ${delay}ms (Attempt ${this.retryCount}/${CONFIG.RABBITMQ_CONNECTION_MAX_RETRIES})`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Declare RabbitMQ exchanges
   */
  private async declareExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      // Declare appointment exchange
      await this.channel.assertExchange(
        CONFIG.APPOINTMENT_EXCHANGE,
        "topic",
        { durable: true }
      );

      console.log(
        `✓ Producer: Declared exchange: ${CONFIG.APPOINTMENT_EXCHANGE}`
      );
    } catch (error: any) {
      console.error("Producer: Error declaring exchanges:", error?.message);
      throw error;
    }
  }

  /**
   * Publish appointment booked event
   */
  async publishAppointmentBooked(appointmentData: any): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      console.error("Producer: Channel not connected, cannot publish event");
      return false;
    }

    try {
      // Ensure all required fields are present
      const payload = {
        appointmentId: appointmentData.appointmentId,
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        doctorName: appointmentData.doctorName,
        patientName: appointmentData.patientName,
        patientEmail: appointmentData.patientEmail,
        patientPhone: appointmentData.patientPhone,
        doctorEmail: appointmentData.doctorEmail,
        doctorPhone: appointmentData.doctorPhone,
        status: appointmentData.status || "booked",
      };

      const message = {
        eventId: `appointment-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: "appointment.booked",
        data: payload,
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: true,
        contentType: "application/json",
        messageId: message.eventId,
      };

      const result = this.channel.publish(
        CONFIG.APPOINTMENT_EXCHANGE,
        CONFIG.APPOINTMENT_ROUTING_KEY,
        messageBuffer,
        publishOptions
      );

      if (result) {
        console.log(
          `✓ Producer: Published appointment.booked event | ID: ${message.eventId}`
        );
      } else {
        console.warn(
          `⚠️  Producer: Failed to publish appointment.booked event`
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ Producer: Error publishing event:", error?.message);
      return false;
    }
  }

  /**
   * Publish appointment cancelled event
   */
  async publishAppointmentCancelled(appointmentData: any): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      console.error("Producer: Channel not connected, cannot publish event");
      return false;
    }

    try {
      const message = {
        eventId: `appointment-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: "appointment.cancelled",
        data: appointmentData,
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: true,
        contentType: "application/json",
        messageId: message.eventId,
      };

      const result = this.channel.publish(
        CONFIG.APPOINTMENT_EXCHANGE,
        "appointment.cancelled",
        messageBuffer,
        publishOptions
      );

      if (result) {
        console.log(
          `✓ Producer: Published appointment.cancelled event | ID: ${message.eventId}`
        );
      } else {
        console.warn(
          `⚠️  Producer: Failed to publish appointment.cancelled event`
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ Producer: Error publishing event:", error?.message);
      return false;
    }
  }

  /**
   * Publish appointment confirmed event (doctor accepted)
   */
  async publishAppointmentConfirmed(appointmentData: any): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      console.error("Producer: Channel not connected, cannot publish event");
      return false;
    }

    try {
      // Ensure all required fields are present
      const payload = {
        appointmentId: appointmentData.appointmentId,
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        doctorName: appointmentData.doctorName,
        patientName: appointmentData.patientName,
        patientEmail: appointmentData.patientEmail,
        patientPhone: appointmentData.patientPhone,
        doctorEmail: appointmentData.doctorEmail,
        doctorPhone: appointmentData.doctorPhone,
        status: appointmentData.status || "confirmed",
        notes: appointmentData.notes,
      };

      const message = {
        eventId: `appointment-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: "appointment.confirmed",
        data: payload,
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: true,
        contentType: "application/json",
        messageId: message.eventId,
      };

      const result = this.channel.publish(
        CONFIG.APPOINTMENT_EXCHANGE,
        "appointment.confirmed",
        messageBuffer,
        publishOptions
      );

      if (result) {
        console.log(
          `✓ Producer: Published appointment.confirmed event | ID: ${message.eventId}`
        );
      } else {
        console.warn(
          `⚠️  Producer: Failed to publish appointment.confirmed event`
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ Producer: Error publishing event:", error?.message);
      return false;
    }
  }

  /**
   * Publish appointment rejected event (doctor rejected)
   */
  async publishAppointmentRejected(appointmentData: any): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      console.error("Producer: Channel not connected, cannot publish event");
      return false;
    }

    try {
      // Ensure all required fields are present
      const payload = {
        appointmentId: appointmentData.appointmentId,
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        doctorName: appointmentData.doctorName,
        patientName: appointmentData.patientName,
        patientEmail: appointmentData.patientEmail,
        patientPhone: appointmentData.patientPhone,
        doctorEmail: appointmentData.doctorEmail,
        doctorPhone: appointmentData.doctorPhone,
        status: appointmentData.status || "rejected",
        rejectionReason: appointmentData.rejectionReason || appointmentData.notes,
      };

      const message = {
        eventId: `appointment-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: "appointment.rejected",
        data: payload,
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: true,
        contentType: "application/json",
        messageId: message.eventId,
      };

      const result = this.channel.publish(
        CONFIG.APPOINTMENT_EXCHANGE,
        "appointment.rejected",
        messageBuffer,
        publishOptions
      );

      if (result) {
        console.log(
          `✓ Producer: Published appointment.rejected event | ID: ${message.eventId}`
        );
      } else {
        console.warn(
          `⚠️  Producer: Failed to publish appointment.rejected event`
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ Producer: Error publishing event:", error?.message);
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
      console.log("✓ Producer: RabbitMQ connection closed");
    } catch (error: any) {
      console.error("Error closing RabbitMQ connection:", error?.message);
    }
  }
}

// Export singleton instance
export default new RabbitMQProducer();
