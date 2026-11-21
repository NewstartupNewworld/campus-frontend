export type CoachField = {
  key: string; label: string; placeholder: string; max: number;
  multiline?: boolean; required?: boolean; long?: boolean;
};
export type CoachSkill = {
  id: string; kind: 'chat' | 'report' | 'test'; icon: string; color: string;
  title: string; subtitle: string; fields: CoachField[];
};
export type CoachTurn = { role: 'user' | 'assistant'; content: string };
export type CoachQuestion = { q: string; options: string[]; answer: number; explain: string };

export const COACH_NOTE = 'AI can make mistakes. This is for study and practice, not medical or legal advice. Always check important facts.';
// END OF FILE