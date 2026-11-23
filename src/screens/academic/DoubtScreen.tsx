import React from 'react';
import { AiChat, useField } from '../../components/AiBits';

export default function DoubtScreen() {
  const f = useField();
  const fromSubjects = f.subjects.slice(0, 3).map((s) => `Explain ${s} in simple words with an example`);
  const starters = fromSubjects.length > 0
    ? fromSubjects
    : ['Explain an important topic of my course in simple words', 'What are the most asked questions in my course?'];
  return (
    <AiChat
      title="Doubt Solver"
      subtitle={`Made for ${f.label}`}
      color="#22C55E"
      chips={f.subjects}
      onAddChip={f.addYours}
      starters={starters}
      introTitle="Ask your doubt"
      introText="Ask any question from your course and get a clear, step by step explanation. Pick a subject above for a better answer."
      makePayload={(q, context, chip) => ({ question: q, subject: chip || f.label, context })}
    />
  );
}
// END OF FILE