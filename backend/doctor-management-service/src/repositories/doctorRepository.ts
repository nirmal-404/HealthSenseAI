import { DoctorProfileModel, IDoctorProfile } from "../models/DoctorProfile";

/**
 * Doctor profile persistence.
 */
export class DoctorRepository {
  async upsertProfile(doc: Partial<IDoctorProfile>): Promise<IDoctorProfile> {
    const out = await DoctorProfileModel.findOneAndUpdate(
      { doctorId: doc.doctorId },
      { $set: { ...doc } },
      { new: true, upsert: true, runValidators: true },
    ).exec();
    if (!out) throw new Error("Doctor upsert failed");
    return out;
  }

  async findByDoctorId(doctorId: string): Promise<IDoctorProfile | null> {
    return DoctorProfileModel.findOne({ doctorId });
  }

  async findBySpeciality(speciality: string): Promise<IDoctorProfile[]> {
    return DoctorProfileModel.find({
      speciality: new RegExp(`^${speciality}$`, "i"),
    }).exec();
  }

  async searchDoctors(name?: string, speciality?: string): Promise<IDoctorProfile[]> {
    const query: any = {};
    if (speciality) {
      query.speciality = new RegExp(speciality, "i");
    }
    if (name) {
      query.$or = [
        { firstName: new RegExp(name, "i") },
        { lastName: new RegExp(name, "i") },
      ];
    }
    return DoctorProfileModel.find(query).exec();
  }

  async addBlockedSlot(
    doctorId: string,
    slotId: string,
  ): Promise<IDoctorProfile | null> {
    return DoctorProfileModel.findOneAndUpdate(
      { doctorId },
      { $addToSet: { blockedSlotIds: slotId } },
      { new: true },
    );
  }

  async updateAvailability(
    doctorId: string,
    weeklySlots: IDoctorProfile["weeklySlots"],
    blockedDates: IDoctorProfile["blockedDates"],
  ): Promise<IDoctorProfile | null> {
    return DoctorProfileModel.findOneAndUpdate(
      { doctorId },
      { $set: { weeklySlots, blockedDates } },
      { new: true },
    );
  }
}
