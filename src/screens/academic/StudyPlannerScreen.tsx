import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { Page, Header, Label, Chips, Button, Card, ErrorCard, Note, UiError, inputBox, useField, aiPost } from '../../components/AiBits';

const HOURS = ['3', '4', '5', '6', '8', '10'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const toApi = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toShow = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function StudyPlannerScreen() {
  const colors = useColors();
  const f = useField();
  const [chosen, setChosen] = useState<string[]>([]);
  const [extra, setExtra] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [hours, setHours] = useState('6');
  const [weak, setWeak] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [error, setError] = useState<UiError | null>(null);

  const options = Array.from(new Set([...f.subjects, ...extra]));

  const addCustom = () => {
    const name = custom.trim();
    if (name.length < 2) return;
    if (!options.includes(name)) setExtra((e) => [...e, name]);
    setChosen((c) => (c.includes(name) ? c : [...c, name]));
    setCustom('');
  };

  const pickDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    DateTimePickerAndroid.open({
      value: examDate ?? new Date(today.getTime() + 14 * 86400000),
      mode: 'date',
      minimumDate: today,
      onChange: (e, date) => { if (e.type === 'set' && date) setExamDate(date); },
    });
  };

  const generate = async () => {
    if (loading) return;
    if (chosen.length === 0) { setError({ title: 'Choose subjects', message: 'Select at least one subject.' }); return; }
    if (!examDate) { setError({ title: 'Choose the exam date', message: 'Tap the date box and pick the date of your exam.' }); return; }
    setLoading(true); setError(null); setPlan(null);
    const r = await aiPost<{ plan: any; daysLeft: number }>('/api/ai/study-plan', {
      subjects: chosen, examDate: toApi(examDate), hoursPerDay: parseInt(hours, 10) || 6,
      weakTopics: weak.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setLoading(false);
    if (!r.ok) { setError(r); return; }
    setPlan(r.data.plan);
    setDaysLeft(r.data.daysLeft);
  };

  return (
    <Page>
      <Header title="Study Planner" subtitle={`Made for ${f.label}`} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Label>Subjects</Label>
        <Chips options={options} value={chosen} onChange={setChosen} color="#F97316" onAdd={f.addYours} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput value={custom} onChangeText={setCustom} placeholder="Or type a subject for this plan" placeholderTextColor={colors.textDim} maxLength={60} onSubmitEditing={addCustom} returnKeyType="done" style={{ ...inputBox(colors), flex: 1 }} />
          <TouchableOpacity onPress={addCustom} accessibilityRole="button" accessibilityLabel="Add subject" style={{ width: 48, borderRadius: 12, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <Label>Exam date</Label>
        <TouchableOpacity onPress={pickDate} accessibilityRole="button" accessibilityLabel="Choose the exam date" style={{ ...inputBox(colors), flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="calendar-outline" size={18} color={examDate ? colors.text : colors.textDim} />
          <Text style={{ color: examDate ? colors.text : colors.textDim, fontSize: 14 }}>{examDate ? toShow(examDate) : 'Tap to choose the date'}</Text>
        </TouchableOpacity>

        <Label>Study hours per day</Label>
        <Chips options={HOURS.map((h) => `${h}h`)} value={`${hours}h`} onChange={(v) => setHours(String(v).replace('h', ''))} color="#F97316" sticky />

        <Label>Weak topics (optional, separate with commas)</Label>
        <TextInput value={weak} onChangeText={setWeak} placeholder="Topics you find hard" placeholderTextColor={colors.textDim} maxLength={200} style={inputBox(colors)} />

        <Button label="Create my study plan" onPress={generate} busy={loading} color="#F97316" />
        <ErrorCard error={error} onRetry={error && chosen.length > 0 && examDate ? generate : undefined} />

        {plan && !plan.raw ? (
          <View style={{ gap: 14, marginTop: 20 }}>
            <Card tint="#F97316">
              <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>{daysLeft} days left, {plan.hoursPerDay}h a day</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>{plan.summary}</Text>
            </Card>
            {plan.weeklyGoals?.length > 0 ? (
              <Card>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Weekly goals</Text>
                {plan.weeklyGoals.map((g: string, i: number) => <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>- {g}</Text>)}
              </Card>
            ) : null}
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Day by day</Text>
            {plan.plan?.slice(0, 14).map((d: any) => (
              <Card key={d.day}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>Day {d.day}: {d.focus}</Text>
                  <Text style={{ color: '#F97316', fontSize: 12, fontWeight: '700' }}>{d.hours}h</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{d.topics?.join(', ')}</Text>
                {d.tip ? <Text style={{ color: colors.textDim, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>Tip: {d.tip}</Text> : null}
              </Card>
            ))}
            {plan.importantTips?.length > 0 ? (
              <Card>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Important tips</Text>
                {plan.importantTips.map((t: string, i: number) => <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>- {t}</Text>)}
              </Card>
            ) : null}
          </View>
        ) : null}
        {plan?.raw ? <View style={{ marginTop: 20 }}><Card><Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{plan.raw}</Text></Card></View> : null}
        <Note />
      </ScrollView>
    </Page>
  );
}
// END OF FILE