import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { AppointmentNotificationPayload, ConsultationCompletedPayload } from "../types";

/**
 * Socket.IO Service - Handles real-time push notifications
 * Manages WebSocket connections and broadcasts notifications to connected clients
 */
class SocketIOService {
  private io: Server | null = null;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private isInitialized: boolean = false;

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
    this.isInitialized = true;

    console.log("✅ Socket.IO initialized successfully");
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) {
      throw new Error("Socket.IO not initialized");
    }

    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle user authentication/identification
      socket.on("register", (userId: string) => {
        this.connectedUsers.set(userId, socket.id);
        socket.join(`user-${userId}`); // Join user-specific room
        console.log(
          `👤 User ${userId} registered with socket ${socket.id}`
        );
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        // Find and remove the user
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(
              `🔌 User ${userId} disconnected (socket: ${socket.id})`
            );
            break;
          }
        }
      });

      // Handle connection errors
      socket.on("error", (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Send appointment booked notification via Socket.IO
   */
  notifyAppointmentBooked(payload: AppointmentNotificationPayload): void {
    if (!this.io || !this.isInitialized) {
      console.warn(
        "⚠️  Socket.IO not initialized, skipping socket notification"
      );
      return;
    }

    try {
      const notification = {
        type: "appointment.booked",
        appointmentId: payload.appointmentId,
        title: "Appointment Booked",
        message: `Your appointment with ${payload.doctorName} is confirmed for ${payload.appointmentDate} at ${payload.appointmentTime}`,
        data: {
          appointmentId: payload.appointmentId,
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          appointmentDate: payload.appointmentDate,
          appointmentTime: payload.appointmentTime,
          timestamp: new Date().toISOString(),
        },
      };

      // Send to patient
      if (payload.patientId) {
        this.io.to(`user-${payload.patientId}`).emit("notification", notification);
        console.log(
          `📱 Socket notification sent to patient: ${payload.patientId}`
        );
      }

      // Send to doctor
      if (payload.doctorId) {
        this.io.to(`user-${payload.doctorId}`).emit("notification", notification);
        console.log(
          `📱 Socket notification sent to doctor: ${payload.doctorId}`
        );
      }

      // Broadcast to all connected clients (optional - for dashboard/admin)
      this.io.emit("appointment-booked", notification);
    } catch (error: any) {
      console.error(
        `❌ Error sending appointment booked notification via Socket.IO: ${error?.message}`
      );
    }
  }

  /**
   * Send appointment confirmed notification via Socket.IO
   */
  notifyAppointmentConfirmed(payload: AppointmentNotificationPayload): void {
    if (!this.io || !this.isInitialized) {
      console.warn(
        "⚠️  Socket.IO not initialized, skipping socket notification"
      );
      return;
    }

    try {
      const notification = {
        type: "appointment.confirmed",
        appointmentId: payload.appointmentId,
        title: "Appointment Confirmed",
        message: `Your appointment with ${payload.doctorName} has been confirmed`,
        data: {
          appointmentId: payload.appointmentId,
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          appointmentDate: payload.appointmentDate,
          appointmentTime: payload.appointmentTime,
          timestamp: new Date().toISOString(),
        },
      };

      // Send to patient
      if (payload.patientId) {
        this.io.to(`user-${payload.patientId}`).emit("notification", notification);
        console.log(
          `📱 Socket notification sent to patient: ${payload.patientId}`
        );
      }

      this.io.emit("appointment-confirmed", notification);
    } catch (error: any) {
      console.error(
        `❌ Error sending appointment confirmed notification via Socket.IO: ${error?.message}`
      );
    }
  }

  /**
   * Send appointment rejected notification via Socket.IO
   */
  notifyAppointmentRejected(payload: AppointmentNotificationPayload): void {
    if (!this.io || !this.isInitialized) {
      console.warn(
        "⚠️  Socket.IO not initialized, skipping socket notification"
      );
      return;
    }

    try {
      const notification = {
        type: "appointment.rejected",
        appointmentId: payload.appointmentId,
        title: "Appointment Rejected",
        message: `Your appointment request has been declined. Please try scheduling another time.`,
        data: {
          appointmentId: payload.appointmentId,
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          timestamp: new Date().toISOString(),
        },
      };

      // Send to patient
      if (payload.patientId) {
        this.io.to(`user-${payload.patientId}`).emit("notification", notification);
        console.log(
          `📱 Socket notification sent to patient: ${payload.patientId}`
        );
      }

      this.io.emit("appointment-rejected", notification);
    } catch (error: any) {
      console.error(
        `❌ Error sending appointment rejected notification via Socket.IO: ${error?.message}`
      );
    }
  }

  /**
   * Send consultation completed notification via Socket.IO
   */
  notifyConsultationCompleted(payload: ConsultationCompletedPayload): void {
    if (!this.io || !this.isInitialized) {
      console.warn(
        "⚠️  Socket.IO not initialized, skipping socket notification"
      );
      return;
    }

    try {
      const notification = {
        type: "consultation.completed",
        sessionId: payload.sessionId,
        title: "Consultation Completed",
        message: `Your consultation with ${payload.doctorName} has been completed`,
        data: {
          sessionId: payload.sessionId,
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          duration: payload.duration,
          timestamp: new Date().toISOString(),
        },
      };

      // Send to both patient and doctor
      if (payload.patientId) {
        this.io.to(`user-${payload.patientId}`).emit("notification", notification);
      }

      if (payload.doctorId) {
        this.io.to(`user-${payload.doctorId}`).emit("notification", notification);
      }

      this.io.emit("consultation-completed", notification);
    } catch (error: any) {
      console.error(
        `❌ Error sending consultation completed notification via Socket.IO: ${error?.message}`
      );
    }
  }

  /**
   * Send generic notification to specific user
   */
  notifyUser(userId: string, notification: any): void {
    if (!this.io || !this.isInitialized) {
      console.warn(
        "⚠️  Socket.IO not initialized, skipping socket notification"
      );
      return;
    }

    this.io.to(`user-${userId}`).emit("notification", notification);
    console.log(`📱 Socket notification sent to user: ${userId}`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastNotification(notification: any): void {
    if (!this.io || !this.isInitialized) {
      console.warn(
        "⚠️  Socket.IO not initialized, skipping broadcast notification"
      );
      return;
    }

    this.io.emit("notification", notification);
    console.log(`📡 Broadcast notification sent to all clients`);
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): Server | null {
    return this.io;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.isInitialized && this.io !== null;
  }

  /**
   * Get number of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

// Export singleton instance
export default new SocketIOService();
