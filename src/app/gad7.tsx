import { Questionnaire } from '@/components/Questionnaire';

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  "Being so restless that it's hard to sit still",
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

export default function Gad7Screen() {
  return <Questionnaire type="GAD-7" questions={GAD7_QUESTIONS} />;
}
