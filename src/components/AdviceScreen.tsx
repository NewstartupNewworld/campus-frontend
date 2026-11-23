import React, { useState } from 'react';
import { Text, TextInput, ScrollView, Share, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeProvider';
import { Page, Header, Label, Chips, Button, Card, ErrorCard, Note, UiError, inputBox, aiPost } from './AiBits';

export type Group = { key: string; label: string; options: string[]; multi?: boolean; initial?: string; sticky?: boolean; onAdd?: () => void };
type Values = Record<string, string | string[]>;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function PlatformList({ items }: { items: { name: string; desc: string; icon: IconName }[] }) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      {items.map((i) => (
        <View key={i.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: colors.border }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={i.icon} size={19} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{i.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{i.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

type Props = {
  title: string; subtitle: string; color: string; groups: Group[]; cgpa?: boolean;
  button: string; resultTitle: string; banner?: string; below?: React.ReactNode;
  build: (v: Values, cgpa: string) => string;
};

/** A short form, then advice from the AI. Used by Internships and Gigs. */
export default function AdviceScreen(p: Props) {
  const colors = useColors();
  const [values, setValues] = useState<Values>(() => {
    const start: Values = {};
    p.groups.forEach((g) => { start[g.key] = g.multi ? [] : g.initial ?? ''; });
    return start;
  });
  const [cgpa, setCgpa] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<UiError | null>(null);

  const run = async () => {
    if (loading) return;
    const first = p.groups[0];
    if (first?.multi && (values[first.key] as string[]).length === 0) {
      setError({ title: 'Choose something first', message: `Select at least one: ${first.label.toLowerCase()}.` });
      return;
    }
    setLoading(true); setError(null); setAnswer('');
    const r = await aiPost<{ answer: string }>('/api/ai/doubt', { subject: 'Career', question: p.build(values, cgpa) });
    setLoading(false);
    if (!r.ok) { setError(r); return; }
    setAnswer(r.data.answer);
  };

  return (
    <Page>
      <Header title={p.title} subtitle={p.subtitle} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {p.banner ? <Card tint="#F97316"><Text style={{ color: colors.textMuted, fontSize: 12.5, lineHeight: 19 }}>{p.banner}</Text></Card> : null}
        {p.groups.map((g) => (
          <View key={g.key}>
            <Label>{g.label}</Label>
            <Chips options={g.options} value={values[g.key]} onChange={(v) => setValues((cur) => ({ ...cur, [g.key]: v }))} color={p.color} sticky={g.sticky} onAdd={g.onAdd} />
          </View>
        ))}
        {p.cgpa ? (
          <>
            <Label>CGPA or percentage (optional)</Label>
            <TextInput value={cgpa} onChangeText={setCgpa} placeholder="e.g. 8.2" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" maxLength={6} style={inputBox(colors)} />
          </>
        ) : null}
        <Button label={p.button} onPress={run} busy={loading} color={p.color} />
        <ErrorCard error={error} onRetry={error && error.title !== 'Choose something first' ? run : undefined} />
        {answer ? (
          <View style={{ marginTop: 20 }}>
            <Card>
              <Text style={{ color: p.color, fontSize: 13, fontWeight: '800', marginBottom: 10 }}>{p.resultTitle}</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{answer}</Text>
              <TouchableOpacity onPress={() => Share.share({ message: answer }).catch(() => {})} accessibilityRole="button" accessibilityLabel="Share" style={{ marginTop: 12, alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center' }}>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Share or copy</Text>
              </TouchableOpacity>
            </Card>
          </View>
        ) : null}
        {p.below ? <View style={{ marginTop: 24 }}><Label>Where to look</Label>{p.below}</View> : null}
        <Note />
      </ScrollView>
    </Page>
  );
}
// END OF FILE