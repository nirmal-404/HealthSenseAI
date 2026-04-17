import api from '../api';

export interface DoctorProfile {
  doctorId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  speciality: string;
  qualifications: string[];
  bio?: string;
  licenseNumber?: string;
  weeklySlots?: WeeklySlot[];
  blockedDates?: { date: string }[];
}

export interface WeeklySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export const doctorService = {
  getProfile: async (id: string) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data.data;
  },

  updateProfile: async (id: string, data: Partial<DoctorProfile>) => {
    const response = await api.put(`/doctors/${id}`, data);
    return response.data.data;
  },

  registerProfile: async (data: Partial<DoctorProfile>) => {
    const response = await api.post(`/doctors/register`, data);
    return response.data.data;
  },

  getAvailability: async (id: string) => {
    const response = await api.get(`/doctors/${id}/availability`);
    return response.data.data;
  },

  updateAvailability: async (id: string, data: { weeklySlots: WeeklySlot[]; blockedDates: { date: string }[] }) => {
    const response = await api.post(`/doctors/${id}/availability`, data);
    return response.data.data;
  },

  searchDoctors: async (params: { speciality?: string; name?: string }) => {
    const response = await api.get('/doctors/search', { params });
    return response.data.data;
  },

  getTimeSlots: async (id: string) => {
    const response = await api.get(`/doctors/${id}/time-slots`);
    return response.data.data;
  },

  getAppointments: async (id: string) => {
    const response = await api.get(`/doctors/${id}/appointments`);
    return response.data.data;
  },
};
