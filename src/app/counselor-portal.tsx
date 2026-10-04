import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { API_BASE_URL } from '@/constants/config';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { loadJSON, removeJSON } from '@/lib/storage';
import { COUNSELOR_SESSION_KEY } from './counselor-login';

interface CounselorSession {
  token: string;
  counselorName: string;
}

interface CounselorAppointment {
  id: string;
  student_alias: string;
  counselor_name: string;
  counselor_title: string;
  location: string;
  appointment_date: string;
  time_slot: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'canceled';
  created_at: string;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CounselorPortalScreen() {
  const router = useRouter();
  const [session, setSession] = useState<CounselorSession | null>(null);
  const [appointments, setAppointments] = useState<CounselorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchSchedule = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/counselor-schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await removeJSON(COUNSELOR_SESSION_KEY);
          router.replace('/counselor-login');
          return;
        }
        return;
      }
      const data = await res.json();
      setAppointments(data);
    } catch {
      // keep quiet or show notice
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadJSON<CounselorSession>(COUNSELOR_SESSION_KEY).then((sess) => {
      if (!sess || !sess.token) {
        router.replace('/counselor-login');
        return;
      }
      setSession(sess);
      fetchSchedule(sess.token);
    });
  }, [fetchSchedule, router]);

  const onRefresh = () => {
    if (session?.token) {
      setRefreshing(true);
      fetchSchedule(session.token);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: 'completed' | 'canceled') => {
    if (!session?.token) return;
    setActionLoadingId(appointmentId);

    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        Alert.alert('Error', 'Could not update session status.');
        return;
      }

      await fetchSchedule(session.token);
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await removeJSON(COUNSELOR_SESSION_KEY);
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDeep]}
            style={styles.headerBadge}
          >
            <MaterialIcons name="medical-services" size={20} color={Colors.white} />
          </LinearGradient>
          <View>
            <Text style={styles.counselorTitle}>Counselor Portal</Text>
            <Text style={styles.counselorName}>{session?.counselorName || 'Counselor'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.privacyBanner}>
          <MaterialIcons name="security" size={20} color={Colors.primary} />
          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>Double-Blind Student Privacy Active</Text>
            <Text style={styles.privacySub}>
              Student real identities (emails & names) are strictly decoupled. Bookings are listed exclusively by Anonymous Alias IDs.
            </Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Room Appointment Schedule</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching schedule...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="event-available" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Booked Sessions</Text>
            <Text style={styles.emptySub}>
              There are currently no student room appointments scheduled for {session?.counselorName}.
            </Text>
          </View>
        ) : (
          appointments.map((app, idx) => (
            <Animated.View
              key={app.id}
              entering={FadeInDown.duration(400).delay(idx * 60)}
              style={styles.appointmentCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.aliasBadge}>
                  <MaterialIcons name="person-outline" size={18} color={Colors.primary} />
                  <Text style={styles.aliasText}>{app.student_alias}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    app.status === 'scheduled'
                      ? styles.statusScheduled
                      : app.status === 'completed'
                      ? styles.statusCompleted
                      : styles.statusCanceled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      app.status === 'scheduled'
                        ? styles.statusScheduledText
                        : app.status === 'completed'
                        ? styles.statusCompletedText
                        : styles.statusCanceledText,
                    ]}
                  >
                    {app.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
                  <Text style={styles.detailText}>
                    {formatDateLabel(app.appointment_date)} ({app.time_slot})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={16} color={Colors.primary} />
                  <Text style={styles.detailText}>{app.location}</Text>
                </View>

                {app.notes ? (
                  <View style={styles.notesRow}>
                    <MaterialIcons name="notes" size={16} color={Colors.textMuted} />
                    <Text style={styles.notesText}>&quot;{app.notes}&quot;</Text>
                  </View>
                ) : null}
              </View>

              {app.status === 'scheduled' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.completeBtn]}
                    onPress={() => handleUpdateStatus(app.id, 'completed')}
                    disabled={actionLoadingId === app.id}
                  >
                    {actionLoadingId === app.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <MaterialIcons name="check-circle" size={16} color={Colors.white} />
                        <Text style={styles.actionBtnTextText}>Mark Completed</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => handleUpdateStatus(app.id, 'canceled')}
                    disabled={actionLoadingId === app.id}
                  >
                    <MaterialIcons name="cancel" size={16} color={Colors.danger} />
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counselorTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  counselorName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerLow,
  },
  logoutText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.danger,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyTextContainer: {
    flex: 1,
    gap: 2,
  },
  privacyTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  privacySub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.two,
  },
  loadingBox: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  emptyBox: {
    padding: Spacing.five,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aliasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  aliasText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textDark,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusScheduled: {
    backgroundColor: Colors.primaryLight + '30',
  },
  statusCompleted: {
    backgroundColor: Colors.success + '20',
  },
  statusCanceled: {
    backgroundColor: Colors.danger + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusScheduledText: {
    color: Colors.primary,
  },
  statusCompletedText: {
    color: Colors.success,
  },
  statusCanceledText: {
    color: Colors.danger,
  },
  cardDetails: {
    gap: 6,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  detailText: {
    fontSize: FontSize.xs,
    color: Colors.textDark,
    fontWeight: '500',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginTop: 4,
  },
  notesText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  completeBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtn: {
    backgroundColor: Colors.surfaceBright,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnTextText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  cancelBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.danger,
  },
});
