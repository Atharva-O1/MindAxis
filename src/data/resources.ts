// Static, hand-written wellness content — not fetched from a backend yet.
export type ResourceCategory = 'Breathing & Grounding' | 'Managing Stress' | 'Sleep & Rest' | 'Support';

export type Resource = {
  id: string;
  category: ResourceCategory;
  title: string;
  summary: string;
  minutes: number;
  body: string[];
};

export const RESOURCES: Resource[] = [
  {
    id: 'box-breathing',
    category: 'Breathing & Grounding',
    title: 'Box breathing for anxious moments',
    summary: 'A simple 4-count breathing pattern to calm your nervous system.',
    minutes: 2,
    body: [
      "Box breathing is a technique used to quickly reduce stress: breathe in for 4 counts, hold for 4, breathe out for 4, hold for 4, and repeat.",
      'Try it before an exam, a difficult conversation, or whenever your thoughts feel like they’re racing. Even one minute of this can help bring your heart rate down.',
      "1. Breathe in slowly through your nose for 4 seconds.\n2. Hold your breath for 4 seconds.\n3. Exhale slowly through your mouth for 4 seconds.\n4. Hold for 4 seconds before breathing in again.",
      'Repeat for 4-6 cycles, or until you notice your body relaxing.',
    ],
  },
  {
    id: 'grounding-5-4-3-2-1',
    category: 'Breathing & Grounding',
    title: '5-4-3-2-1 grounding technique',
    summary: 'Use your senses to pull yourself out of a spiral of worry.',
    minutes: 3,
    body: [
      "Grounding techniques help when anxiety makes it hard to feel present. This one uses your five senses to bring your attention back to the room you're in.",
      'Name: 5 things you can see. 4 things you can touch. 3 things you can hear. 2 things you can smell. 1 thing you can taste.',
      'There’s no need to rush — take your time with each sense. Most people notice their breathing has slowed by the time they finish.',
    ],
  },
  {
    id: 'exam-stress',
    category: 'Managing Stress',
    title: 'Coping with exam stress',
    summary: 'Practical ways to manage pressure during exam season.',
    minutes: 4,
    body: [
      "Exam stress is one of the most common things students deal with, and some pressure is normal — it's a sign you care about doing well. But it shouldn't take over your daily life.",
      'A few things that help: break study sessions into 25-45 minute blocks with short breaks in between, rather than marathon all-nighters. Sleep matters more than one extra hour of revision — a tired brain retains less.',
      'Talk to someone if you notice you’re skipping meals, unable to sleep, or feeling constantly on edge. That’s a sign to lighten the load, not push harder — reach out to a friend, family member, or use the chat companion in this app to talk it through.',
    ],
  },
  {
    id: 'homesickness',
    category: 'Managing Stress',
    title: 'Homesickness in hostel life',
    summary: 'It’s common to miss home — here’s how to settle in.',
    minutes: 3,
    body: [
      'Moving away from home for college is a big adjustment, and feeling homesick doesn’t mean you’re not adapting well — it’s a normal part of the transition for most students.',
      'Keep a light, regular routine of calling family rather than avoiding it (too much or too little contact can both make it harder). Try to build one or two small routines in your new place — a regular meal spot, a walk, a weekly call with a friend from home — so the new environment starts to feel familiar too.',
      'If the feeling stays heavy for weeks rather than easing, that’s worth talking to someone about — a counselor, a senior, or a trusted friend.',
    ],
  },
  {
    id: 'sleep-routine',
    category: 'Sleep & Rest',
    title: 'Building a better sleep routine',
    summary: 'Small, realistic changes that actually help you sleep.',
    minutes: 3,
    body: [
      "Sleep is often the first thing to slip during stressful periods, and the least glamorous thing to fix — but it has an outsized effect on mood, focus, and how well you cope with everything else.",
      'Try to keep a consistent wake-up time, even on weekends — it anchors your body clock more than a consistent bedtime does. Dim screens and bright lights an hour before bed if you can.',
      'If your mind races once you’re in bed, keep a notepad nearby to jot down whatever’s looping in your head — it’s often enough to let it go until morning.',
    ],
  },
  {
    id: 'when-to-seek-help',
    category: 'Support',
    title: 'When to reach out for help',
    summary: 'Signs that it’s time to talk to someone, and how to do it.',
    minutes: 3,
    body: [
      'It can be hard to tell the difference between a rough week and something that needs more support. A few signs worth paying attention to: persistent low mood or anxiety lasting more than two weeks, withdrawing from friends and activities you usually enjoy, or noticeable changes in sleep and appetite.',
      'Reaching out doesn’t have to mean a big step — it can start with a conversation with a friend, a message to a counselor, or an anonymous chat in this app. None of it means something is wrong with you; it means you’re paying attention to yourself.',
      'If you’re in crisis or having thoughts of harming yourself, please use the crisis helplines below right away.',
    ],
  },
];

export function getResource(id: string) {
  return RESOURCES.find((resource) => resource.id === id);
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  'Breathing & Grounding',
  'Managing Stress',
  'Sleep & Rest',
  'Support',
];
