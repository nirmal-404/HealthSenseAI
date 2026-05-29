import express, { Express } from "express";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { DoctorRepository } from "./repositories/doctorRepository";
import { PrescriptionRepository } from "./repositories/prescriptionRepository";
import { DoctorService } from "./service/doctorService";
import { PrescriptionService } from "./service/prescriptionService";
import { AppointmentClient } from "./service/appointmentClient";
import { PatientReportsService } from "./service/patientReportsService";

/**
 * Express app factory with composed services.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  const doctors = new DoctorRepository();
  const rxRepo = new PrescriptionRepository();
  const appointments = new AppointmentClient();
  const patients = new PatientReportsService();
  const doctorService = new DoctorService(doctors, appointments, patients);
  const prescriptionService = new PrescriptionService(rxRepo);

  (app.locals as any).doctorService = doctorService;
  (app.locals as any).prescriptionService = prescriptionService;

  app.use("/", routes);
  app.use(errorHandler);
  return app;
}
