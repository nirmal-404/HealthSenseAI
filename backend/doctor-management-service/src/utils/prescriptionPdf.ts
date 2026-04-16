import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { IPrescription } from "../models/Prescription";

/**
 * Builds a prescription PDF buffer with embedded QR image.
 */
export async function buildPrescriptionPdf(
  rx: Pick<
    IPrescription,
    | "prescriptionId"
    | "patientId"
    | "doctorId"
    | "medications"
    | "notes"
    | "consultationSessionId"
  >,
  verifyUrl: string,
): Promise<Buffer> {
  const qrPng = await QRCode.toBuffer(verifyUrl, { type: "png", width: 160 });
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50 });
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(18).text("Prescription", { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`ID: ${rx.prescriptionId}`);
    doc.text(`Patient: ${rx.patientId}`);
    doc.text(`Doctor: ${rx.doctorId}`);
    if (rx.consultationSessionId) {
      doc.text(`Session: ${rx.consultationSessionId}`);
    }
    doc.moveDown();
    doc.fontSize(12).text("Medications", { underline: true });
    rx.medications.forEach((m, i) => {
      doc.moveDown(0.3);
      doc.fontSize(10).text(`${i + 1}. ${m.name}`);
      doc.text(`   Dosage: ${m.dosage} | Freq: ${m.frequency} | Duration: ${m.duration}`);
    });
    if (rx.notes) {
      doc.moveDown();
      doc.fontSize(10).text(`Notes: ${rx.notes}`);
    }
    doc.moveDown();
    doc.image(qrPng, doc.x, doc.y, { width: 100 });
    doc.moveDown(4);
    doc.fontSize(8).text("Scan QR to verify authenticity.");
    doc.end();
  });
}
