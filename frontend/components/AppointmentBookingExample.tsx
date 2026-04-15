'use client';

import React, { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { sendAppointmentConfirmation } from '@/lib/notificationService';

interface AppointmentBookingExampleProps {
  userId: string;
  userEmail: string;
}

/**
 * AppointmentBookingExample Component
 * Demonstrates how to integrate notification sending when booking an appointment
 */
export function AppointmentBookingExample({
  userId,
  userEmail,
}: AppointmentBookingExampleProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bookingData, setBookingData] = useState({
    patientId: userId,
    doctorId: 'doc-123',
    appointmentDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:30',
    appointmentType: 'video',
    symptoms: 'Regular checkup',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Step 1: Book appointment via API
      const appointmentResponse = await axiosInstance.post(
        '/api/appointments/book',
        bookingData
      );

      if (appointmentResponse.data.success) {
        setMessage('✅ Appointment booked successfully!');

        // Step 2: Send notification to patient
        try {
          await sendAppointmentConfirmation(
            userId,
            userEmail,
            {
              doctorName: 'Dr. Smith', // Get from doctor data
              appointmentDate: bookingData.appointmentDate,
              appointmentTime: bookingData.startTime,
              appointmentType: bookingData.appointmentType,
            }
          );
          setMessage((prev) =>
            prev + '\n✉️ Confirmation email sent to ' + userEmail
          );
        } catch (notificationError) {
          console.error('Notification error:', notificationError);
          setMessage(
            (prev) =>
              prev +
              '\n⚠️ Appointment booked but notification failed to send'
          );
        }

        // Reset form
        setBookingData({
          patientId: userId,
          doctorId: 'doc-123',
          appointmentDate: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '10:30',
          appointmentType: 'video',
          symptoms: 'Regular checkup',
        });
      }
    } catch (error: any) {
      setMessage(
        `❌ Error: ${error.response?.data?.message || 'Failed to book appointment'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Book Appointment</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.includes('❌')
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          } whitespace-pre-line`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleBookAppointment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Doctor ID</label>
          <input
            type="text"
            name="doctorId"
            value={bookingData.doctorId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Appointment Date</label>
          <input
            type="date"
            name="appointmentDate"
            value={bookingData.appointmentDate}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={bookingData.startTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="time"
              name="endTime"
              value={bookingData.endTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Appointment Type</label>
          <select
            name="appointmentType"
            value={bookingData.appointmentType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="video">Video Consultation</option>
            <option value="in-person">In-Person Visit</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Symptoms/Reason</label>
          <input
            type="text"
            name="symptoms"
            value={bookingData.symptoms}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📧 What happens next:</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>✓ Appointment is saved to database</li>
          <li>✓ Confirmation email is sent to {userEmail}</li>
          <li>✓ Doctor receives notification</li>
          <li>✓ Reminder will be sent 24 hours before</li>
        </ul>
      </div>
    </div>
  );
}
