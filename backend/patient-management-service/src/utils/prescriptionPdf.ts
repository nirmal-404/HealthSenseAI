import PDFDocument from "pdfkit";
import { IMedicationLine } from "../models/Prescription";

type PrescriptionPdfInput = {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  issuedDate: Date;
  medications: IMedicationLine[];
  notes?: string;
};

export const buildPrescriptionPdf = async (
  payload: PrescriptionPdfInput
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("HealthSenseAI Prescription", { underline: true });
    doc.moveDown();

    doc.fontSize(11).text(`Prescription ID: ${payload.prescriptionId}`);
    doc.text(`Appointment ID: ${payload.appointmentId}`);
    doc.text(`Patient ID: ${payload.patientId}`);
    doc.text(`Doctor ID: ${payload.doctorId}`);
    doc.text(`Issued Date: ${payload.issuedDate.toISOString()}`);

    doc.moveDown();
    doc.fontSize(13).text("Medications", { underline: true });

    payload.medications.forEach((medication, index) => {
      doc.moveDown(0.5);
      doc.fontSize(11).text(`${index + 1}. ${medication.name}`);
      doc
        .fontSize(10)
        .text(
          `Dosage: ${medication.dosage} | Frequency: ${medication.frequency} | Duration: ${medication.duration}`
        );
    });

    if (payload.notes?.trim()) {
      doc.moveDown();
      doc.fontSize(12).text("Notes", { underline: true });
      doc.fontSize(10).text(payload.notes.trim());
    }

    doc.end();
  });
};
