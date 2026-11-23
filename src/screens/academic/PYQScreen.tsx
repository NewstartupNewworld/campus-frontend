import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { Page, Header, Label, Chips, Button, Card, ErrorCard, Note, UiError, inputBox, useField, aiPost } from '../../components/AiBits';

const EXAM_TYPES = ['Mid-sem', 'End-sem', 'Entrance', 'Interview'];
const likelyColor = (l: string) => (l === 'very likely' ? '#EF4444' : l === 'likely' ? '#F97316' : '#22C55E');
const importColor = (i: string) => (i === 'high' ? '#EF4444' : i === 'medium' ? '#F97316' : '#22C55E');
const Tag = ({ text, color }: { text: string; color: string }) => (
  <View style={{ backgroundColor: color + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
    <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{text}</Text>
  </View>
);

export default function PYQScreen() {
  const colors = useColors();
  const f = useField();
  const [questions, setQuestions] = useState(['', '', '']);
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('End-sem');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<UiError | null>(null);

  const valid = questions.map((q) => q.trim()).filter(Boolean);

  const analyze = async () => {
    if (loading) return;
    if (valid.length < 2) { setError({ title: 'Add more questions', message: 'Please add at least 2 previous year questions.' }); return; }
    setLoading(true); setError(null); setAnalysis(null);
    const r = await aiPost<{ analysis: any }>('/api/ai/pyq', { questions: valid, subject: subject || f.label, examType: examType.toLowerCase() });
    setLoading(false);
    if (!r.ok) { setError(r); return; }
    setAnalysis(r.data.analysis);
  };

  return (
    <Page>
      <Header title="PYQ Analyzer" subtitle={`Patterns in previous year questions, ${f.label}`} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Label>Subject (optional)</Label>
        <Chips options={f.subjects} value={subject} onChange={setSubject} color="#7C5CFF" onAdd={f.addYours} />
        <Label>Exam type</Label>
        <Chips options={EXAM_TYPES} value={examType} onChange={setExamType} color="#7C5CFF" sticky />

        <Label>Paste previous year questions</Label>
        <View style={{ gap: 10 }}>
          {questions.map((q, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <Text style={{ color: '#7C5CFF', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <TextInput
                value={q}
                onChangeText={(t) => setQuestions((prev) => prev.map((x, idx) => (idx === i ? t : x)))}
                placeholder={`Question ${i + 1}`}
                placeholderTextColor={colors.textDim}
                multiline
                maxLength={600}
                style={{ ...inputBox(colors), flex: 1, minHeight: 60, fontSize: 13 }}
              />
              {questions.length > 2 ? (
                <TouchableOpacity onPress={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))} accessibilityRole="button" accessibilityLabel={`Remove question ${i + 1}`} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EF444422', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
        {questions.length < 15 ? (
          <TouchableOpacity onPress={() => setQuestions((p) => [...p, ''])} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#7C5CFF', borderStyle: 'dashed', marginTop: 12 }}>
            <Ionicons name="add" size={18} color="#7C5CFF" />
            <Text style={{ color: '#7C5CFF', fontSize: 14, fontWeight: '600' }}>Add another question</Text>
          </TouchableOpacity>
        ) : null}

        <Button label="Analyze patterns" onPress={analyze} busy={loading} color="#7C5CFF" />
        <ErrorCard error={error} onRetry={error && valid.length >= 2 ? analyze : undefined} />

        {analysis && !analysis.raw ? (
          <View style={{ gap: 14, marginTop: 20 }}>
            <Card tint="#7C5CFF">
              <Text style={{ color: '#7C5CFF', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>Summary</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>{analysis.summary}</Text>
            </Card>
            {analysis.topTopics?.length > 0 ? (
              <Card>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>Top topics</Text>
                {analysis.topTopics.map((t: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: colors.border }}>
                    <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>{t.topic}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Text style={{ color: colors.textDim, fontSize: 12 }}>{t.frequency}x</Text>
                      <Tag text={String(t.importance)} color={importColor(t.importance)} />
                    </View>
                  </View>
                ))}
              </Card>
            ) : null}
            {analysis.predictions?.length > 0 ? (
              <Card>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>Likely to come</Text>
                {analysis.predictions.map((p: any, i: number) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{p.topic}</Text>
                      <Tag text={String(p.likelihood)} color={likelyColor(p.likelihood)} />
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.reason}</Text>
                  </View>
                ))}
                <Text style={{ color: colors.textDim, fontSize: 11 }}>These are guesses from the pattern, not a promise of what will come.</Text>
              </Card>
            ) : null}
            {analysis.prepTips?.length > 0 ? (
              <Card>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Preparation tips</Text>
                {analysis.prepTips.map((t: string, i: number) => <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>- {t}</Text>)}
              </Card>
            ) : null}
          </View>
        ) : null}
        {analysis?.raw ? <View style={{ marginTop: 20 }}><Card><Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{analysis.raw}</Text></Card></View> : null}
        <Note />
      </ScrollView>
    </Page>
  );
}
// END OF FILE