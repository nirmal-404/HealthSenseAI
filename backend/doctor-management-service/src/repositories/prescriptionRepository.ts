import { IPrescription, PrescriptionModel } from "../models/Prescription";

/**
 * Prescription persistence.
 */
export class PrescriptionRepository {
  async create(doc: Partial<IPrescription>): Promise<IPrescription> {
    return PrescriptionModel.create(doc);
  }

  async findById(prescriptionId: string): Promise<IPrescription | null> {
    return PrescriptionModel.findOne({ prescriptionId });
  }

  async listByDoctor(
    doctorId: string,
    page: number,
    limit: number,
  ): Promise<{ items: IPrescription[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PrescriptionModel.find({ doctorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-pdfBuffer -verifyJwt"),
      PrescriptionModel.countDocuments({ doctorId }),
    ]);
    return { items: items as IPrescription[], total };
  }
}
