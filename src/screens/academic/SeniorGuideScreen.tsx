import React from 'react';
import { AiChat, useField } from '../../components/AiBits';

const BASE_TOPICS = ['Career', 'Exams', 'Higher studies', 'Internships', 'College life', 'Skills'];

export default function SeniorGuideScreen() {
  const f = useField();
  const topics = Array.from(new Set([...BASE_TOPICS, ...(f.profile?.interests ?? []).slice(0, 4)]));
  const starters = [
    `How do I get started with a career in ${f.label}?`,
    `Which skills should I build in ${f.label} while I am in college?`,
    `How do I balance studies and practical work?`,
    `Is higher study worth it in ${f.label}? What are the options?`,
    `How do I find good internships in ${f.label}?`,
    `What mistakes should a first year student of ${f.label} avoid?`,
  ];
  return (
    <AiChat
      title="AI Senior Guide"
      subtitle={`Advice in the style of a senior, for ${f.label}`}
      color="#EF4444"
      chips={topics}
      starters={starters}
      introTitle="Your AI senior"
      introText="This is an AI, not a real student. It gives practical, senior style advice for your field. Where things differ by college or city, it will say so."
      makePayload={(q, context, chip) => ({
        subject: chip || 'Career',
        context,
        question: `You are an AI giving advice in the style of an experienced final year senior of ${f.label}${f.profile?.program ? ` (${f.profile.program})` : ''} in India, talking to a junior.
Topic: ${chip || 'General'}
Question: ${q}

Be honest and practical. Give specific steps. Do not claim personal experiences you do not have, and do not invent facts about particular companies, hospitals, courts or colleges. If something depends on the college, the city or the year, say so. Keep it warm and conversational.`,
      })}
    />
  );
}
// END OF FILE