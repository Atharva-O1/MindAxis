<<<<<<< HEAD
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
=======
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { CounselorData, generateMockSlots, MOCK_COUNSELORS } from '@/data/mockCounselors';
import { loadJSON, saveJSON } from '@/lib/storage';

export type Counselor = CounselorData;

export type CounselorSlot = {
  id: number;
  counselorId: number;
  slotTime: string;
  isBooked: boolean;
};

export type Appointment = {
  id: number;
  anonymousId: string;
  counselorId: number;
  counselorName: string;
  location: string;
  slotTime: string;
  topic: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: string;
};

type BookAppointmentResult = { success: boolean; error?: string; appointment?: Appointment };
type CancelAppointmentResult = { success: boolean; error?: string };

type AppointmentContextValue = {
  counselors: Counselor[];
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  isLoading: boolean;
  fetchSlots: (counselorId: number) => Promise<CounselorSlot[]>;
  bookAppointment: (counselorId: number, slotId: number, topic?: string) => Promise<BookAppointmentResult>;
  cancelAppointment: (appointmentId: number) => Promise<CancelAppointmentResult>;
  refresh: () => Promise<void>;
};

const AppointmentContext = createContext<AppointmentContextValue | null>(null);

const STORAGE_KEY_APPOINTMENTS = 'mindaxis.appointments.list';
const STORAGE_KEY_SLOTS = 'mindaxis.appointments.slots_cache';

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const { status, token, anonymousId } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>(MOCK_COUNSELORS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load appointments and counselors
  async function loadData() {
    // 1. Try local storage first
    const cachedAppointments = await loadJSON<Appointment[]>(STORAGE_KEY_APPOINTMENTS);
    if (cachedAppointments) {
      setAppointments(cachedAppointments);
    }

    if (status !== 'signedIn' || !token) {
      return;
    }

    setIsLoading(true);
    try {
      // Fetch counselors from backend
      const counselorsRes = await fetch(`${API_BASE_URL}/counselors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (counselorsRes.ok) {
        const remoteCounselors = await counselorsRes.json();
        if (Array.isArray(remoteCounselors) && remoteCounselors.length > 0) {
          setCounselors(
            remoteCounselors.map((c: any) => ({
              id: c.id,
              name: c.name,
              title: c.title,
              department: c.department,
              location: c.location,
              specialties: c.specialties,
              bio: c.bio,
              avatarColor: c.avatar_color ?? '#0058be',
            })),
          );
        }
      }

      // Fetch user appointments from backend
      const apptRes = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apptRes.ok) {
        const remoteAppts = await apptRes.json();
        const formatted: Appointment[] = remoteAppts.map((a: any) => ({
          id: a.id,
          anonymousId: a.anonymous_id,
          counselorId: a.counselor_id,
          counselorName: a.counselor_name,
          location: a.location,
          slotTime: a.slot_time,
          topic: a.topic,
          status: a.status,
          createdAt: a.created_at,
        }));
        setAppointments(formatted);
        await saveJSON(STORAGE_KEY_APPOINTMENTS, formatted);
      }
    } catch {
      // Backend unavailable; keep cached local state
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [status, token]);

  async function fetchSlots(counselorId: number): Promise<CounselorSlot[]> {
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/counselors/${counselorId}/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.map((s: any) => ({
            id: s.id,
            counselorId: s.counselor_id,
            slotTime: s.slot_time,
            isBooked: s.is_booked,
          }));
        }
      } catch {
        // Fall back to offline slot generation
      }
    }

    // Offline / fallback slots
    const offlineSlots = generateMockSlots(counselorId);
    // Mark booked if student has booked one of these offline
    const bookedSlotTimes = new Set(
      appointments
        .filter((a) => a.counselorId === counselorId && a.status === 'scheduled')
        .map((a) => a.slotTime),
    );
    return offlineSlots.map((s) => ({
      ...s,
      isBooked: s.isBooked || bookedSlotTimes.has(s.slotTime),
    }));
  }

  async function bookAppointment(
    counselorId: number,
    slotId: number,
    topic = '',
  ): Promise<BookAppointmentResult> {
    const counselor = counselors.find((c) => c.id === counselorId);
    if (!counselor) {
      return { success: false, error: 'Counselor not found.' };
    }

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            counselor_id: counselorId,
            slot_id: slotId,
            topic,
          }),
        });

        if (res.ok) {
          const raw = await res.json();
          const created: Appointment = {
            id: raw.id,
            anonymousId: raw.anonymous_id,
            counselorId: raw.counselor_id,
            counselorName: raw.counselor_name,
            location: raw.location,
            slotTime: raw.slot_time,
            topic: raw.topic,
            status: raw.status,
            createdAt: raw.created_at,
          };
          const next = [created, ...appointments.filter((a) => a.id !== created.id)];
          setAppointments(next);
          await saveJSON(STORAGE_KEY_APPOINTMENTS, next);
          return { success: true, appointment: created };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.detail ?? 'Failed to book slot.' };
        }
      } catch {
        // Network failure, fall through to offline local booking
      }
    }

    // Offline booking fallback
    const offlineSlots = generateMockSlots(counselorId);
    const chosenSlot = offlineSlots.find((s) => s.id === slotId);
    const slotTimeStr = chosenSlot?.slotTime ?? new Date().toISOString();

    const offlineAppointment: Appointment = {
      id: Date.now(),
      anonymousId: anonymousId ?? 'offline-anon',
      counselorId,
      counselorName: counselor.name,
      location: counselor.location,
      slotTime: slotTimeStr,
      topic,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    const next = [offlineAppointment, ...appointments];
    setAppointments(next);
    await saveJSON(STORAGE_KEY_APPOINTMENTS, next);
    return { success: true, appointment: offlineAppointment };
  }

  async function cancelAppointment(appointmentId: number): Promise<CancelAppointmentResult> {
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const updated = await res.json();
          const next = appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a,
          );
          setAppointments(next);
          await saveJSON(STORAGE_KEY_APPOINTMENTS, next);
          return { success: true };
        }
      } catch {
        // fallback to offline cancel
      }
    }

    // Offline cancel fallback
    const next = appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a,
    );
    setAppointments(next);
    await saveJSON(STORAGE_KEY_APPOINTMENTS, next);
    return { success: true };
  }

  const upcomingAppointments = useMemo(() => {
    const now = new Date().getTime();
    return appointments
      .filter((a) => a.status === 'scheduled' && new Date(a.slotTime).getTime() >= now - 3600000)
      .sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());
  }, [appointments]);

  const value = useMemo(
    () => ({
      counselors,
      appointments,
      upcomingAppointments,
      isLoading,
      fetchSlots,
      bookAppointment,
      cancelAppointment,
      refresh: loadData,
    }),
    [counselors, appointments, upcomingAppointments, isLoading],
  );

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointments must be used within an AppointmentProvider');
  return ctx;
>>>>>>> origin/master
}
