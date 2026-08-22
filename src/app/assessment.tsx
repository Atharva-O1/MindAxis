import { Questionnaire } from '@/components/Questionnaire';

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things',
  'Moving or speaking noticeably slowly, or being fidgety/restless',
  'Thoughts that you would be better off dead, or of hurting yourself',
];

export default function AssessmentScreen() {
  return <Questionnaire questions={PHQ9_QUESTIONS} />;
}
