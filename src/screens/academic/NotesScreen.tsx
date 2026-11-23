import React, { useState } from 'react';
import { Text, TextInput, ScrollView, Share, TouchableOpacity, View } from 'react-native';
import { useColors } from '../../theme/ThemeProvider';
import { Page, Header, Label, Chips, Button, Card, ErrorCard, Note, UiError, inputBox, useField, aiPost } from '../../components/AiBits';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const STYLES = ['Concise', 'Detailed', 'Exam-focused'];

export default function NotesScreen() {
  const colors = useColors();
  const f = useField();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [style, setStyle] = useState('Exam-focused');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<UiError | null>(null);

  const generate = async () => {
    if (loading) return;
    if (topic.trim().length < 2) { setError({ title: 'Enter a topic', message: 'Write the topic you want notes for.' }); return; }
    setLoading(true); setError(null); setNotes('');
    const r = await aiPost<{ notes: string }>('/api/ai/notes', {
      topic: topic.trim(), subject: subject || f.label, level: level.toLowerCase(), style: style.toLowerCase(),
    });
    setLoading(false);
    if (!r.ok) { setError(r); return; }
    setNotes(r.data.notes);
  };

  return (
    <Page>
      <Header title="Notes Generator" subtitle={`Made for ${f.label}`} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Label>Topic</Label>
        <TextInput value={topic} onChangeText={setTopic} placeholder="A chapter or concept from your course" placeholderTextColor={colors.textDim} maxLength={150} style={inputBox(colors)} />
        <Label>Subject (optional)</Label>
        <Chips options={f.subjects} value={subject} onChange={setSubject} color="#4F7CFF" onAdd={f.addYours} />
        <Label>Level</Label>
        <Chips options={LEVELS} value={level} onChange={setLevel} color="#22C55E" sticky />
        <Label>Style</Label>
        <Chips options={STYLES} value={style} onChange={setStyle} color="#F97316" sticky />
        <Button label="Generate notes" onPress={generate} busy={loading} color="#4F7CFF" />
        <ErrorCard error={error} onRetry={error && topic.trim().length >= 2 ? generate : undefined} />
        {notes ? (
          <View style={{ marginTop: 20 }}>
            <Card>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>{topic}</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{notes}</Text>
              <TouchableOpacity onPress={() => Share.share({ message: notes }).catch(() => {})} accessibilityRole="button" accessibilityLabel="Share notes" style={{ marginTop: 12, alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center' }}>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Share or copy</Text>
              </TouchableOpacity>
            </Card>
          </View>
        ) : null}
        <Note />
      </ScrollView>
    </Page>
  );
}
// END OF FILE