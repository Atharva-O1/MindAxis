import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CrisisBanner } from '@/components/CrisisBanner';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Counselor, useAppointments } from '@/context/AppointmentContext';

function getUpcomingDates(): string[] {
  const dates = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AppointmentsScreen() {
  const { counselors, appointments, loading, bookAppointment, cancelAppointment } = useAppointments();
  const [activeTab, setActiveTab] = useState<'book' | 'my'>('book');
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = getUpcomingDates();

  const handleOpenBookingModal = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setSelectedDate(dates[0]);
    setSelectedSlot(counselor.available_slots[0] || '');
  };

  const handleConfirmBooking = async () => {
    if (!selectedCounselor || !selectedDate || !selectedSlot) return;
    setIsSubmitting(true);
    const res = await bookAppointment({
      counselorName: selectedCounselor.name,
      counselorTitle: selectedCounselor.title,
      location: selectedCounselor.location,
      date: selectedDate,
      timeSlot: selectedSlot,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSelectedCounselor(null);
      setActiveTab('my');
      Alert.alert(
        'Appointment Confirmed 📍',
        `Your in-person session with ${selectedCounselor.name} is scheduled for ${formatDateLabel(
          selectedDate
        )} at ${selectedSlot}.\n\nLocation: ${selectedCounselor.location}`
      );
    } else {
      Alert.alert('Booking Error', res.error || 'Failed to book appointment.');
    }
  };

  const handleCancel = (id: string, counselorName: string) => {
    const doCancel = async () => {
      const res = await cancelAppointment(id);
      if (!res.success) {
        Alert.alert('Error', res.error || 'Could not cancel appointment.');
      } else {
        Alert.alert('Appointment Canceled', 'Your session has been canceled.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to cancel your appointment with ${counselorName}?`)) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Appointment',
        `Are you sure you want to cancel your appointment with ${counselorName}?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: doCancel,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'book' && styles.tabButtonActive]}
          onPress={() => setActiveTab('book')}
        >
          <MaterialIcons
            name="person-add"
            size={18}
            color={activeTab === 'book' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'book' && styles.tabTextActive]}>
            Book In-Person
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my')}
        >
          <MaterialIcons
            name="event"
            size={18}
            color={activeTab === 'my' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Appointments ({appointments.filter((a) => a.status === 'scheduled').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <CrisisBanner />
        </Animated.View>

        {activeTab === 'book' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campus Wellness Counselors</Text>
            <Text style={styles.sectionSubtitle}>
              Schedule a confidential, offline in-person session at your campus wellness office.
            </Text>

            {counselors.map((counselor, idx) => (
              <Animated.View key={counselor.id} entering={FadeInDown.duration(350).delay(idx * 60)}>
                <View style={[styles.card, CardShadow]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <MaterialIcons name="local-hospital" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.counselorInfo}>
                      <Text style={styles.counselorName}>{counselor.name}</Text>
                      <Text style={styles.counselorTitle}>{counselor.title}</Text>
                      <View style={styles.specialtyBadge}>
                        <Text style={styles.specialtyText}>{counselor.specialty}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <MaterialIcons name="place" size={16} color={Colors.textMuted} />
                    <Text style={styles.locationText}>{counselor.location}</Text>
                  </View>

                  <AnimatedPressable
                    style={styles.bookButton}
                    onPress={() => handleOpenBookingModal(counselor)}
                  >
                    <Text style={styles.bookButtonText}>Book Offline Session</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={Colors.white} />
                  </AnimatedPressable>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Scheduled Visits</Text>

            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : appointments.length === 0 ? (
              <View style={[styles.emptyCard, CardShadow]}>
                <MaterialIcons name="event-note" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Appointments Booked</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't scheduled any in-person counselor sessions yet.
                </Text>
              </View>
            ) : (
              appointments.map((app, idx) => (
                <Animated.View key={app.id} entering={FadeInDown.duration(350).delay(idx * 60)}>
                  <View style={[styles.card, CardShadow]}>
                    <View style={styles.appHeader}>
                      <View style={styles.appHeaderLeft}>
                        <Text style={styles.counselorName}>{app.counselor_name}</Text>
                        <Text style={styles.counselorTitle}>{app.counselor_title}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          app.status === 'scheduled' ? styles.statusScheduled : styles.statusCanceled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            app.status === 'scheduled' ? styles.statusScheduledText : styles.statusCanceledText,
                          ]}
                        >
                          {app.status === 'scheduled' ? 'Scheduled' : 'Canceled'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsBlock}>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
                        <Text style={styles.detailText}>
                          {formatDateLabel(app.appointment_date || app.created_at || '')} ({app.time_slot})
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="location-on" size={16} color={Colors.primary} />
                        <Text style={styles.detailText}>{app.location}</Text>
                      </View>
                    </View>

                    {app.status === 'scheduled' && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancel(app.id, app.counselor_name)}
                      >
                        <MaterialIcons name="cancel" size={16} color={Colors.danger} />
                        <Text style={styles.cancelButtonText}>Cancel Session</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={!!selectedCounselor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book In-Person Session</Text>
              <TouchableOpacity onPress={() => setSelectedCounselor(null)}>
                <MaterialIcons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            {selectedCounselor && (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.modalCounselor}>{selectedCounselor.name}</Text>
                <Text style={styles.modalLocation}>📍 {selectedCounselor.location}</Text>

                <Text style={styles.pickerLabel}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {dates.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.chip, selectedDate === d && styles.chipActive]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[styles.chipText, selectedDate === d && styles.chipTextActive]}>
                        {formatDateLabel(d)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.pickerLabel}>Select Time Slot</Text>
                <View style={styles.slotGrid}>
                  {selectedCounselor.available_slots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          selectedSlot === slot && styles.slotTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleConfirmBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm In-Person Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.four,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.two,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counselorInfo: {
    flex: 1,
    gap: 2,
  },
  counselorName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
  },
  counselorTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  specialtyBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  specialtyText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  locationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  bookButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appHeaderLeft: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusScheduled: {
    backgroundColor: '#e6f4ea',
  },
  statusCanceled: {
    backgroundColor: '#fce8e6',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statusScheduledText: {
    color: '#137333',
  },
  statusCanceledText: {
    color: Colors.danger,
  },
  detailsBlock: {
    backgroundColor: Colors.surfaceBright,
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textDark,
    fontWeight: '500',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  cancelButtonText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalCounselor: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.two,
  },
  modalLocation: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.three,
  },
  pickerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.two,
    backgroundColor: Colors.surfaceBright,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textDark,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.white,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceBright,
  },
  slotChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: {
    fontSize: FontSize.xs,
    color: Colors.textDark,
  },
  slotTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
