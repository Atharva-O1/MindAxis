import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import {
  Appointment,
  Counselor,
  CounselorSlot,
  useAppointments,
} from '@/context/AppointmentContext';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitials(name: string) {
  const parts = name.replace(/^(Dr\.|Ms\.|Mr\.)\s*/i, '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || 'CP';
}

export default function CounselorsScreen() {
  const router = useRouter();
  const {
    counselors,
    appointments,
    upcomingAppointments,
    isLoading,
    fetchSlots,
    bookAppointment,
    cancelAppointment,
  } = useAppointments();

  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('book');

  // Booking modal state
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [slots, setSlots] = useState<CounselorSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CounselorSlot | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Appointment | null>(null);

  // Group slots by day
  const slotsByDay = slots.reduce<Record<string, CounselorSlot[]>>((acc, slot) => {
    const key = new Date(slot.slotTime).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const availableDays = Object.keys(slotsByDay);

  async function openBookingModal(counselor: Counselor) {
    setSelectedCounselor(counselor);
    setSelectedSlot(null);
    setTopic('');
    setIsLoadingSlots(true);
    try {
      const fetched = await fetchSlots(counselor.id);
      setSlots(fetched);
      const days = Array.from(new Set(fetched.map((s) => new Date(s.slotTime).toDateString())));
      if (days.length > 0) {
        setSelectedDayKey(days[0]);
      }
    } catch {
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function handleConfirmBooking() {
    if (!selectedCounselor || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      const res = await bookAppointment(selectedCounselor.id, selectedSlot.id, topic.trim());
      if (res.success && res.appointment) {
        setSelectedCounselor(null);
        setBookingSuccessModal(res.appointment);
      } else {
        const errorMsg = res.error || 'Failed to complete booking. Please try another slot.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Booking Error', errorMsg);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelAppointment(appointment: Appointment) {
    const confirmMessage = `Cancel your appointment with ${appointment.counselorName} on ${formatDate(appointment.slotTime)} at ${formatTime(appointment.slotTime)}?`;

    const executeCancel = async () => {
      await cancelAppointment(appointment.id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        executeCancel();
      }
    } else {
      Alert.alert('Cancel Appointment', confirmMessage, [
        { text: 'Keep Appointment', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: executeCancel },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Top Segmented Controls */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('book')}
          style={[styles.segmentBtn, activeTab === 'book' && styles.segmentBtnActive]}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="person-search"
            size={18}
            color={activeTab === 'book' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'book' && styles.segmentBtnTextActive,
            ]}
          >
            Find a Counselor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('my-appointments')}
          style={[styles.segmentBtn, activeTab === 'my-appointments' && styles.segmentBtnActive]}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="event"
            size={18}
            color={activeTab === 'my-appointments' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'my-appointments' && styles.segmentBtnTextActive,
            ]}
          >
            My Sessions
          </Text>
          {upcomingAppointments.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{upcomingAppointments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Confidentiality & In-Person Banner */}
      <View style={styles.privacyBanner}>
        <MaterialIcons name="shield" size={20} color={Colors.primary} />
        <View style={styles.privacyBannerTextGroup}>
          <Text style={styles.privacyBannerTitle}>In-Person & Double-Blind Protected</Text>
          <Text style={styles.privacyBannerSub}>
            All sessions take place in confidential campus rooms. Your student identity is protected by an anonymous token.
          </Text>
        </View>
      </View>

      {activeTab === 'book' ? (
        /* Counselors Directory */
        <FlatList
          data={counselors}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(400).delay(index * 70)}
              style={[styles.counselorCard, CardShadow]}
            >
              <View style={styles.counselorHeader}>
                <View
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: item.avatarColor || Colors.primary },
                  ]}
                >
                  <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.counselorInfo}>
                  <Text style={styles.counselorName}>{item.name}</Text>
                  <Text style={styles.counselorTitle}>{item.title}</Text>
                  <Text style={styles.counselorDept}>{item.department}</Text>
                </View>
              </View>

              {/* In-Person Office Location Box */}
              <View style={styles.locationBox}>
                <MaterialIcons name="room" size={18} color={Colors.primary} />
                <View style={styles.locationTextGroup}>
                  <Text style={styles.locationLabel}>In-Person Campus Location:</Text>
                  <Text style={styles.locationValue}>{item.location}</Text>
                </View>
              </View>

              {item.bio ? <Text style={styles.bioText}>{item.bio}</Text> : null}

              {/* Specialties */}
              {item.specialties ? (
                <View style={styles.specialtiesWrap}>
                  {item.specialties.split(',').map((spec, i) => (
                    <View key={i} style={styles.specialtyChip}>
                      <Text style={styles.specialtyChipText}>{spec.trim()}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Book Button */}
              <TouchableOpacity
                onPress={() => openBookingModal(item)}
                style={styles.bookButton}
                activeOpacity={0.85}
              >
                <MaterialIcons name="calendar-today" size={18} color={Colors.white} />
                <Text style={styles.bookButtonText}>Select Date & In-Person Slot</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      ) : (
        /* My Appointments List */
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No scheduled sessions</Text>
              <Text style={styles.emptySub}>
                You haven&apos;t booked an in-person counselor appointment yet.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('book')}
                style={styles.emptyCta}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyCtaText}>Browse Available Counselors</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCancelled = item.status === 'cancelled';
            const isCompleted = item.status === 'completed';
            const isScheduled = item.status === 'scheduled';

            return (
              <Animated.View
                entering={FadeInDown.duration(350).delay(index * 60)}
                style={[
                  styles.appointmentCard,
                  CardShadow,
                  isCancelled && styles.appointmentCardCancelled,
                ]}
              >
                <View style={styles.appointmentTopRow}>
                  <View style={styles.appointmentTimeGroup}>
                    <Text
                      style={[
                        styles.appointmentDate,
                        isCancelled && styles.textStrike,
                      ]}
                    >
                      {formatDate(item.slotTime)}
                    </Text>
                    <Text style={styles.appointmentTime}>{formatTime(item.slotTime)}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isScheduled && styles.statusPillScheduled,
                      isCancelled && styles.statusPillCancelled,
                      isCompleted && styles.statusPillCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isScheduled && styles.statusPillTextScheduled,
                        isCancelled && styles.statusPillTextCancelled,
                        isCompleted && styles.statusPillTextCompleted,
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.appointmentCounselorRow}>
                  <MaterialIcons name="person" size={20} color={Colors.primary} />
                  <Text style={styles.appointmentCounselorName}>{item.counselorName}</Text>
                </View>

                {/* Office Location */}
                <View style={styles.appointmentLocationRow}>
                  <MaterialIcons name="location-on" size={18} color={Colors.textMuted} />
                  <Text style={styles.appointmentLocationText}>{item.location}</Text>
                </View>

                {item.topic ? (
                  <View style={styles.topicRow}>
                    <Text style={styles.topicLabel}>Focus / Topic: </Text>
                    <Text style={styles.topicValue}>{item.topic}</Text>
                  </View>
                ) : null}

                <View style={styles.appointmentFooter}>
                  <View style={styles.anonRefBadge}>
                    <MaterialIcons name="lock" size={12} color={Colors.textMuted} />
                    <Text style={styles.anonRefText}>Token Ref: #{String(item.id).slice(-4)}</Text>
                  </View>

                  {isScheduled && (
                    <TouchableOpacity
                      onPress={() => handleCancelAppointment(item)}
                      style={styles.cancelBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Session</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isScheduled && (
                  <View style={styles.inPersonReminder}>
                    <MaterialIcons name="info-outline" size={14} color={Colors.primary} />
                    <Text style={styles.inPersonReminderText}>
                      Please arrive 5 minutes early. Present your token ref at reception if needed.
                    </Text>
                  </View>
                )}
              </Animated.View>
            );
          }}
        />
      )}

      {/* Booking Slot Selection Modal */}
      <Modal
        visible={Boolean(selectedCounselor)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedCounselor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Book In-Person Session</Text>
                <Text style={styles.modalSubtitle}>{selectedCounselor?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCounselor(null)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            {isLoadingSlots ? (
              <View style={styles.loadingSlotsWrap}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingSlotsText}>Loading available campus slots...</Text>
              </View>
            ) : availableDays.length === 0 ? (
              <View style={styles.noSlotsWrap}>
                <MaterialIcons name="event-busy" size={40} color={Colors.textMuted} />
                <Text style={styles.noSlotsTitle}>No slots available</Text>
                <Text style={styles.noSlotsSub}>
                  All currently scheduled in-person slots for this counselor are booked. Please check back soon.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Counselor Location Reminder */}
                <View style={styles.modalLocationBadge}>
                  <MaterialIcons name="place" size={18} color={Colors.primary} />
                  <Text style={styles.modalLocationText}>
                    Location: {selectedCounselor?.location}
                  </Text>
                </View>

                {/* Day Selector Chips */}
                <Text style={styles.modalSectionLabel}>1. Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                  {availableDays.map((dayKey) => {
                    const isSelected = selectedDayKey === dayKey;
                    const d = new Date(dayKey);
                    return (
                      <TouchableOpacity
                        key={dayKey}
                        onPress={() => {
                          setSelectedDayKey(dayKey);
                          setSelectedSlot(null);
                        }}
                        style={[styles.dayChip, isSelected && styles.dayChipActive]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dayChipWeekday, isSelected && styles.dayChipTextActive]}>
                          {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.dayChipDate, isSelected && styles.dayChipTextActive]}>
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Slot Chips */}
                <Text style={styles.modalSectionLabel}>2. Select Available Time</Text>
                <View style={styles.slotGrid}>
                  {(slotsByDay[selectedDayKey] || []).map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isBooked = slot.isBooked;

                    return (
                      <TouchableOpacity
                        key={slot.id}
                        disabled={isBooked}
                        onPress={() => setSelectedSlot(slot)}
                        style={[
                          styles.slotChip,
                          isSelected && styles.slotChipActive,
                          isBooked && styles.slotChipDisabled,
                        ]}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons
                          name="access-time"
                          size={16}
                          color={
                            isSelected
                              ? Colors.white
                              : isBooked
                              ? Colors.textMuted
                              : Colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.slotChipText,
                            isSelected && styles.slotChipTextActive,
                            isBooked && styles.slotChipTextDisabled,
                          ]}
                        >
                          {formatTime(slot.slotTime)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Optional Topic */}
                <Text style={styles.modalSectionLabel}>3. Reason / Notes (Optional & Anonymous)</Text>
                <TextInput
                  style={styles.topicInput}
                  placeholder="e.g., Exam anxiety, sleep issues, feeling overwhelmed..."
                  placeholderTextColor={Colors.textMuted}
                  value={topic}
                  onChangeText={setTopic}
                  maxLength={160}
                />

                {/* Anonymous Guarantee */}
                <View style={styles.anonNotice}>
                  <MaterialIcons name="lock" size={16} color={Colors.textMuted} />
                  <Text style={styles.anonNoticeText}>
                    Your appointment is booked anonymously. The counselor will not receive your student name or email.
                  </Text>
                </View>

                {/* Confirm Action Button */}
                <TouchableOpacity
                  disabled={!selectedSlot || isSubmitting}
                  onPress={handleConfirmBooking}
                  style={[
                    styles.confirmBookingBtn,
                    (!selectedSlot || isSubmitting) && styles.confirmBookingBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color={Colors.white} />
                      <Text style={styles.confirmBookingBtnText}>
                        {selectedSlot
                          ? `Confirm Session for ${formatTime(selectedSlot.slotTime)}`
                          : 'Select a Time Slot to Continue'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Booking Success Dialog */}
      <Modal
        visible={Boolean(bookingSuccessModal)}
        animationType="fade"
        transparent
        onRequestClose={() => setBookingSuccessModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successDialog}>
            <View style={styles.successIconCircle}>
              <MaterialIcons name="done" size={36} color={Colors.white} />
            </View>
            <Text style={styles.successTitle}>In-Person Session Booked!</Text>
            <Text style={styles.successSub}>
              Your appointment has been anonymously confirmed.
            </Text>

            <View style={styles.successDetailsBox}>
              <View style={styles.successDetailRow}>
                <MaterialIcons name="person" size={18} color={Colors.primary} />
                <Text style={styles.successDetailText}>
                  {bookingSuccessModal?.counselorName}
                </Text>
              </View>
              <View style={styles.successDetailRow}>
                <MaterialIcons name="schedule" size={18} color={Colors.primary} />
                <Text style={styles.successDetailText}>
                  {bookingSuccessModal &&
                    `${formatDate(bookingSuccessModal.slotTime)} at ${formatTime(
                      bookingSuccessModal.slotTime,
                    )}`}
                </Text>
              </View>
              <View style={styles.successDetailRow}>
                <MaterialIcons name="place" size={18} color={Colors.primary} />
                <Text style={styles.successDetailText}>
                  {bookingSuccessModal?.location}
                </Text>
              </View>
              <View style={styles.successDetailRow}>
                <MaterialIcons name="qr-code" size={18} color={Colors.textMuted} />
                <Text style={styles.successDetailMuted}>
                  Anonymous Token Ref: #{String(bookingSuccessModal?.id).slice(-4)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setBookingSuccessModal(null);
                setActiveTab('my-appointments');
              }}
              style={styles.successDoneBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneBtnText}>View in My Sessions</Text>
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.half,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
  segmentBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  segmentBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badgeCount: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  badgeCountText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyBannerTextGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  privacyBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  privacyBannerSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  listContent: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
  },
  separator: {
    height: Spacing.three,
  },
  counselorCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.three,
  },
  counselorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  counselorInfo: {
    flex: 1,
  },
  counselorName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  counselorTitle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  counselorDept: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: Colors.surfaceBright,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationTextGroup: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  locationValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 2,
  },
  bioText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  specialtyChip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  specialtyChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    marginTop: Spacing.one,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.two,
  },
  appointmentCardCancelled: {
    opacity: 0.7,
    backgroundColor: '#fafafa',
  },
  appointmentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentTimeGroup: {
    gap: 2,
  },
  appointmentDate: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  appointmentTime: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  textStrike: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusPillScheduled: {
    backgroundColor: '#e8f5e9',
  },
  statusPillCancelled: {
    backgroundColor: '#f5f5f5',
  },
  statusPillCompleted: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextScheduled: {
    color: '#2e7d32',
  },
  statusPillTextCancelled: {
    color: Colors.textMuted,
  },
  statusPillTextCompleted: {
    color: Colors.primary,
  },
  appointmentCounselorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 4,
  },
  appointmentCounselorName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textDark,
  },
  appointmentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  appointmentLocationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBright,
    padding: Spacing.two,
    borderRadius: Radius.sm,
    marginTop: 2,
  },
  topicLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  topicValue: {
    fontSize: FontSize.xs,
    color: Colors.textDark,
    flex: 1,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  anonRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anonRefText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
  },
  cancelBtnText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  inPersonReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.two,
    borderRadius: Radius.sm,
    marginTop: 2,
  },
  inPersonReminderText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: Spacing.three,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.lg,
  },
  emptyCtaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: Spacing.one,
  },
  modalScroll: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  modalLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  modalLocationText: {
    fontSize: FontSize.sm,
    color: Colors.textDark,
    fontWeight: '600',
    flex: 1,
  },
  modalSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.one,
  },
  dayScroll: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dayChip: {
    backgroundColor: Colors.surfaceBright,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    marginRight: Spacing.two,
    minWidth: 80,
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayChipWeekday: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  dayChipDate: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 2,
  },
  dayChipTextActive: {
    color: Colors.white,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  slotChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotChipDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  slotChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textDark,
  },
  slotChipTextActive: {
    color: Colors.white,
  },
  slotChipTextDisabled: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  topicInput: {
    backgroundColor: Colors.surfaceBright,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: FontSize.sm,
    color: Colors.textDark,
  },
  anonNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  anonNoticeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  confirmBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.four,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
  },
  confirmBookingBtnDisabled: {
    backgroundColor: Colors.border,
  },
  confirmBookingBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  loadingSlotsWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  loadingSlotsText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  noSlotsWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  noSlotsTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
  },
  noSlotsSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  successDialog: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.four,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    ...CardShadow,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  successSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  successDetailText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textDark,
  },
  successDetailMuted: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  successDoneBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  successDoneBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
