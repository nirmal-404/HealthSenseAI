import api from '../api';

export interface TelemedicineSession {
  sessionId: string;
  patientId: string;
  doctorId: string;
  status: 'scheduled' | 'active' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  summary?: {
    transcript?: string;
    soapNotes?: string;
    actionItems?: string[];
  };
}

export const telemedicineService = {
  createSession: async (data: { patientId: string; doctorId: string }) => {
    const response = await api.post('/sessions/create', data);
    return response.data.data;
  },

  getSession: async (id: string) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data.data;
  },

  getDoctorSessions: async (doctorId: string) => {
    const response = await api.get(`/sessions/doctor/${doctorId}`);
    return response.data.data;
  },

  joinSession: async (id: string) => {
    const response = await api.post(`/sessions/${id}/join`);
    return response.data.data;
  },

  getSessionSummary: async (id: string) => {
    const response = await api.get(`/sessions/${id}/summary`);
    return response.data.data;
  },

  endSession: async (id: string) => {
    const response = await api.patch(`/sessions/${id}/end`);
    return response.data.data;
  },
};
