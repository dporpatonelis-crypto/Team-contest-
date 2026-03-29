import { Team, ContestSession, Award } from './types';

export const INITIAL_TEAMS: Team[] = [
  {
    id: '1',
    name: 'House of Socrates',
    campus: 'Athens Campus',
    score: 1240,
    rank: 1,
    displayId: 'I',
    color: 'primary',
  },
  {
    id: '2',
    name: 'Lyceum Scholars',
    campus: 'Aristotle Guild',
    score: 1185,
    rank: 2,
    displayId: 'II',
    color: 'secondary',
  },
  {
    id: '3',
    name: 'The Stoics',
    campus: 'Zeno Collective',
    score: 1020,
    rank: 3,
    displayId: 'III',
    color: 'tertiary',
  },
  {
    id: '4',
    name: 'Epicurean Circle',
    campus: 'Garden Academy',
    score: 985,
    rank: 4,
    displayId: 'IV',
    color: 'outline',
  },
];

export const INITIAL_SESSION: ContestSession = {
  title: 'Introduction to Classical Philosophy: The Socratic Debate',
  hall: 'Oxford Hall A',
  currentQuestion: 12,
  totalQuestions: 20,
  timerSeconds: 522, // 08:42
  status: 'active',
};

export const INITIAL_AWARDS: Award[] = [
  {
    id: 'a1',
    title: 'Most Eloquent Orator',
    description: 'Awarded for persuasive rhetoric and clarity of thesis during the Great Debate.',
    recipient: 'Marcus Aurelius V.',
    icon: 'history_edu',
  },
  {
    id: 'a2',
    title: 'Master of Logic',
    description: 'Commended for the flawless application of syllogism in the final examination phase.',
    recipient: 'Elena S. P.',
    icon: 'lightbulb',
  },
  {
    id: 'a3',
    title: 'Chief Archivist',
    description: 'Recognized for the meticulous curation of primary sources and citations.',
    recipient: 'Julian K. Thorne',
    icon: 'library_books',
  },
];
