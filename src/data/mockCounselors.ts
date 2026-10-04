export type CounselorData = {
  id: number;
  name: string;
  title: string;
  department: string;
  location: string;
  specialties: string;
  bio: string;
  avatarColor: string;
};

export const MOCK_COUNSELORS: CounselorData[] = [
  {
    id: 1,
    name: 'Dr. Sunita Rao, Ph.D.',
    title: 'Lead Campus Psychologist',
    department: 'Student Well-being Center',
    location: 'Health & Wellness Block, Room 204',
    specialties: 'Academic Burnout, Anxiety, Identity, Crisis Support',
    bio: 'Over 12 years of experience supporting university students navigating high-stress academic environments.',
    avatarColor: '#0058be',
  },
  {
    id: 2,
    name: 'Dr. Rajesh Varma, MD',
    title: 'Senior Clinical Counselor',
    department: 'Department of Mental Health & Guidance',
    location: 'North Wing Clinic, Cabin 12',
    specialties: 'Depression, Sleep Optimization, Social Anxiety',
    bio: 'Specializes in cognitive behavioral approaches for young adults and transition-to-college challenges.',
    avatarColor: '#1c7a4d',
  },
  {
    id: 3,
    name: 'Ms. Neha Patel, M.Phil',
    title: 'Student Wellness Specialist',
    department: 'Student Affairs Guidance Unit',
    location: 'Central Library Annex, Counseling Suite A',
    specialties: 'Time Management, Relationship Stress, Mindfulness',
    bio: 'Warm, student-centered approach focusing on stress regulation and building personal resilience.',
    avatarColor: '#8c4a00',
  },
];

export type MockSlot = {
  id: number;
  counselorId: number;
  slotTime: string;
  isBooked: boolean;
};

export function generateMockSlots(counselorId: number): MockSlot[] {
  const slots: MockSlot[] = [];
  const now = new Date();
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const times = [
    { hour: 10, min: 0 },
    { hour: 11, min: 30 },
    { hour: 14, min: 0 },
    { hour: 15, min: 30 },
  ];

  let idCounter = counselorId * 100;

  for (let d = 1; d <= 5; d++) {
    const slotDate = new Date(baseDate);
    slotDate.setDate(baseDate.getDate() + d);

    // Skip Saturday and Sunday
    const dayOfWeek = slotDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const t of times) {
      const dt = new Date(slotDate);
      dt.setHours(t.hour, t.min, 0, 0);
      slots.push({
        id: ++idCounter,
        counselorId,
        slotTime: dt.toISOString(),
        isBooked: false,
      });
    }
  }

  return slots;
}
