
export type Team = {
  id: string;
  name: string;
  campus: string;
  score: number;
  rank: number;
  displayId: string; // e.g. "I", "II"
  color: string;
};

export type SessionStatus = 'idle' | 'active' | 'paused' | 'finished';

export type ContestSession = {
  title: string;
  hall: string;
  currentQuestion: number;
  totalQuestions: number;
  timerSeconds: number;
  status: SessionStatus;
};

export type ActivityLog = {
  id: string;
  teamName: string;
  points: number;
  reason: string;
  timestamp: Date;
};

export type Award = {
  id: string;
  title: string;
  description: string;
  recipient: string;
  icon: string;
};
