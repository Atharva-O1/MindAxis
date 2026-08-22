// Lightweight keyword-matched canned replies — a frontend-only placeholder
// for the real chat companion. This is NOT an AI model; wiring up the actual
// local LLM (Ollama via LangChain, streamed over WebSocket) is backend/AI
// work per the project's learning order. This just makes the mock feel less
// like a single scripted line while that's built.
type ReplyRule = {
  keywords: string[];
  responses: string[];
};

const RULES: ReplyRule[] = [
  {
    keywords: ['exam', 'test', 'deadline', 'assignment', 'stress', 'stressed'],
    responses: [
      "That sounds like a lot of pressure. What's feeling heaviest right now — the workload itself, or the worry about how it'll turn out?",
      "Exam stress has a way of taking over everything else. Have you been able to take any breaks, or has it been non-stop?",
    ],
  },
  {
    keywords: ['sleep', 'insomnia', 'tired', 'exhausted', 'can’t sleep', 'cant sleep'],
    responses: [
      "Not sleeping well can make everything else feel harder to handle. How many nights has this been going on?",
      "That sounds exhausting. Is it trouble falling asleep, or do you wake up and can't get back to it?",
    ],
  },
  {
    keywords: ['sad', 'down', 'depressed', 'hopeless', 'empty', 'numb'],
    responses: [
      "Thank you for telling me that. Feeling that way can be really isolating — how long has it felt like this?",
      "That sounds heavy to carry. You don't have to explain it perfectly — just tell me whatever comes to mind.",
    ],
  },
  {
    keywords: ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'overwhelmed'],
    responses: [
      "It makes sense that would feel overwhelming. Is this a new feeling, or something that's been building for a while?",
      "That sounds like a lot to hold at once. When you notice it most — is it a specific moment, or more of a constant background hum?",
    ],
  },
  {
    keywords: ['alone', 'lonely', 'isolated', 'no friends', 'homesick'],
    responses: [
      "That's a hard thing to sit with. Has there been anyone — even one person — you've been able to talk to about this?",
      "Feeling alone in a new place is more common than it seems. What's made it feel that way lately?",
    ],
  },
  {
    keywords: ['hi', 'hello', 'hey', 'sup'],
    responses: [
      "Hey. I'm glad you're here — what's been on your mind?",
      "Hi there. However today's been for you, this is a good place to talk it through.",
    ],
  },
];

const FALLBACK_RESPONSES = [
  "Thanks for sharing that. Can you tell me a bit more about how it's been affecting you?",
  "I hear you. What's been the hardest part of that for you?",
  "That sounds like a lot. How long has this been on your mind?",
  "I appreciate you opening up about that. What would feel most helpful to talk through right now?",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getMockReply(userText: string): string {
  const lower = userText.toLowerCase();
  const matchedRule = RULES.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword)));
  return pickRandom(matchedRule ? matchedRule.responses : FALLBACK_RESPONSES);
}
