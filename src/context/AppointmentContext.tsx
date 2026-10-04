import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { loadJSON, saveJSON } from '@/lib/storage';

export interface Counselor {
  id: any;
  name: string;
  title: string;
  specialty?: string;
  specialties?: string;
  department?: string;
  location: string;
  bio?: string;
  avatar_color?: string;
  avatarColor?: string;
  available_slots: string[];
}

export interface CounselorSlot {
  id: number;
  counselorId: number;
  slotTime: string;
  isBooked: boolean;
}

export interface Appointment {
  id: any;
  anonymousId?: string;
  anonymous_id?: string;
  counselorId?: number;
  counselor_id?: number;
  counselor_name: string;
  counselorName: string;
  counselor_title?: string;
  location: string;
  appointment_date?: string;
  time_slot?: string;
  slotTime: string;
  slot_time?: string;
  topic?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'cancelled';
  created_at?: string;
  createdAt?: string;
}

interface BookParams {
  counselorName?: string;
  counselorTitle?: string;
  counselorId?: number;
  slotId?: number;
  topic?: string;
  location?: string;
  date?: string;
  timeSlot?: string;
  notes?: string;
}

interface AppointmentContextType {
  counselors: Counselor[];
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  loading: boolean;
  isLoading: boolean;
  fetchSlots: (counselorId: number) => Promise<CounselorSlot[]>;
  bookAppointment: (arg1: any, arg2?: any, arg3?: any) => Promise<{ success: boolean; error?: string; appointment?: Appointment }>;
  cancelAppointment: (id: any) => Promise<{ success: boolean; error?: string }>;
  refreshAppointments: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);
const STORAGE_KEY = 'mindaxis.appointments.list';

function _formatAppt(a: any): Appointment {
  const cName = a.counselor_name || a.counselorName || 'Counselor';
  const slot = a.time_slot || a.slotTime || a.slot_time || a.appointment_date || new Date().toISOString();
  return {
    ...a,
    counselor_name: cName,
    counselorName: cName,
    slotTime: slot,
    slot_time: slot,
    appointment_date: a.appointment_date || slot,
    time_slot: a.time_slot || slot,
  };
}

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const { token, status } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>([
    {
      id: "c1",
      name: "Dr. Ananya Sharma",
      title: "Senior Clinical Psychologist",
      specialty: "Academic Stress & Anxiety Management",
      location: "Student Wellness Center, Room 204",
      available_slots: ["10:00 AM - 10:45 AM", "02:00 PM - 02:45 PM", "04:00 PM - 04:45 PM"],
    },
    {
      id: "c2",
      name: "Prof. Rajesh Kumar",
      title: "Student Wellness Counselor",
      specialty: "Relationship & Social Guidance",
      location: "Academic Block B, Room 102",
      available_slots: ["11:00 AM - 11:45 AM", "03:00 PM - 03:45 PM"],
    },
    {
      id: "c3",
      name: "Dr. Priya Nair",
      title: "Mental Health Specialist",
      specialty: "Mindfulness & Personal Growth",
      location: "Health & Counseling Wing, Room 308",
      available_slots: ["09:30 AM - 10:15 AM", "01:30 PM - 02:15 PM"],
    },
  ]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cached appointments
  useEffect(() => {
    loadJSON<Appointment[]>(STORAGE_KEY).then((cached) => {
      if (cached && Array.isArray(cached)) setAppointments(cached.map(_formatAppt));
    });
  }, []);

  // Fetch campus counselors
  useEffect(() => {
    fetch(`${API_BASE_URL}/appointments/counselors`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCounselors(data);
      })
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
        const formatted = Array.isArray(data) ? data.map(_formatAppt) : [];
        setAppointments(formatted);
        await saveJSON(STORAGE_KEY, formatted);
      }
    } catch (err) {
      console.log('[Appointments] Failed to fetch user appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (
    params: any
  ): Promise<{ success: boolean; error?: string; appointment?: Appointment }> => {
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
          counselor_name: params.counselorName || params.counselor_name || 'Counselor',
          counselor_title: params.counselorTitle || params.counselor_title || 'Counselor',
          location: params.location || 'Wellness Office',
          appointment_date: params.date || params.appointment_date || new Date().toISOString().split('T')[0],
          time_slot: params.timeSlot || params.time_slot || '10:00 AM',
          notes: params.notes || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, error: data.detail || 'Booking failed' };
      }

      const formatted = _formatAppt(data);
      const next = [formatted, ...appointments];
      setAppointments(next);
      await saveJSON(STORAGE_KEY, next);
      setLoading(false);
      return { success: true, appointment: formatted };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error while booking appointment.' };
    }
  };

  const cancelAppointment = async (
    id: any
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

      const next = appointments.map((app) => (String(app.id) === String(id) ? { ...app, status: 'canceled' as const } : app));
      setAppointments(next);
      await saveJSON(STORAGE_KEY, next);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error while canceling appointment.' };
    }
  };

  const upcomingAppointments = useMemo(() => {
    return appointments.filter((a) => a.status === 'scheduled');
  }, [appointments]);

  const fetchSlots = async (counselorId: number): Promise<CounselorSlot[]> => {
    return [];
  };

  return (
    <AppointmentContext.Provider
      value={{
        counselors,
        appointments,
        upcomingAppointments,
        loading,
        isLoading: loading,
        fetchSlots,
        bookAppointment,
        cancelAppointment,
        refreshAppointments,
        refresh: refreshAppointments,
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

