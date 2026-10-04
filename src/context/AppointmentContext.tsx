import React, { createContext, useContext, useEffect, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';

export interface Counselor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  location: string;
  available_slots: string[];
}

export interface Appointment {
  id: string;
  counselor_name: string;
  counselor_title: string;
  location: string;
  appointment_date: string;
  time_slot: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'canceled';
  created_at?: string;
}

interface BookParams {
  counselorName: string;
  counselorTitle: string;
  location: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

interface AppointmentContextType {
  counselors: Counselor[];
  appointments: Appointment[];
  loading: boolean;
  bookAppointment: (params: BookParams) => Promise<{ success: boolean; error?: string }>;
  cancelAppointment: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const { token, status } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch campus counselors
  useEffect(() => {
    fetch(`${API_BASE_URL}/appointments/counselors`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCounselors(data))
      .catch((err) => console.log('[Appointments] Failed to load counselors:', err));
  }, []);

  // Fetch user's booked appointments upon sign in
  useEffect(() => {
    if (status !== 'signedIn' || !token) return;
    refreshAppointments();
  }, [status, token]);

  const refreshAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.log('[Appointments] Failed to fetch user appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (
    params: BookParams
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          counselor_name: params.counselorName,
          counselor_title: params.counselorTitle,
          location: params.location,
          appointment_date: params.date,
          time_slot: params.timeSlot,
          notes: params.notes || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, error: data.detail || 'Booking failed' };
      }

      setAppointments((prev) => [data, ...prev]);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error while booking appointment.' };
    }
  };

  const cancelAppointment = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, error: data.detail || 'Cancellation failed' };
      }

      setAppointments((prev) =>
        prev.map((app) => (String(app.id) === String(id) ? { ...app, status: 'canceled' } : app))
      );
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error while canceling appointment.' };
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        counselors,
        appointments,
        loading,
        bookAppointment,
        cancelAppointment,
        refreshAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}
