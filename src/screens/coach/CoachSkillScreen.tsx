import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, Share, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';
import { apiRequest, alertApiError } from '../../utils/api';
import { CoachSkill, CoachTurn, CoachQuestion, COACH_NOTE } from '../../utils/coach';

type Phase = 'setup' | 'running' | 'result';
const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

export default function CoachSkillScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const skill: CoachSkill = route.params.skill;
  const { rootRef, onLayout, pad } = useKeyboardPadding();

  const [values, setValues] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('setup');
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<CoachTurn[]>([]);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [reply, setReply] = useState('');
  const [questions, setQuestions] = useState<CoachQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const listRef = useRef<FlatList<CoachTurn>>(null);

  // Test timer: one minute per question
  useEffect(() => {
    if (!(phase === 'running' && skill.kind === 'test')) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [phase, skill.kind]);
  useEffect(() => {
    if (phase === 'running' && skill.kind === 'test' && questions.length > 0 && secondsLeft <= 0) setPhase('result');
  }, [secondsLeft, phase, skill.kind, questions.length]);

  const resetAll = () => {
    setPhase('setup'); setTurns([]); setInput(''); setDone(false); setReply('');
    setQuestions([]); setAnswers([]); setSecondsLeft(0);
  };

  const leave = () => {
    if (phase === 'running') {
      Alert.alert('Leave this session?', 'Your progress in this session will be lost.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const start = async () => {
    if (busy) return;
    const missing = skill.fields.find((f) => f.required && (values[f.key] ?? '').trim().length < 2);
    if (missing) { Alert.alert('Please fill', missing.label); return; }
    setBusy(true);
    if (skill.kind === 'report') {
      const r = await apiRequest<{ reply: string }>('/api/coach/run', { method: 'POST', body: { skill: skill.id, inputs: values } });
      setBusy(false);
      if (!r.ok) return alertApiError(r);
      setReply(r.data.reply);
      setPhase('result');
    } else if (skill.kind === 'chat') {
      const r = await apiRequest<{ reply: string; done: boolean }>('/api/coach/chat', {
        method: 'POST', body: { skill: skill.id, inputs: values, history: [], message: '' },
      });
      setBusy(false);
      if (!r.ok) return alertApiError(r);
      setTurns([{ role: 'assistant', content: r.data.reply }]);
      setDone(!!r.data.done);
      setPhase('running');
    } else {
      const r = await apiRequest<{ questions: CoachQuestion[] }>('/api/coach/test', { method: 'POST', body: { skill: skill.id, inputs: values } });
      setBusy(false);
      if (!r.ok) return alertApiError(r);
      setQuestions(r.data.questions);
      setAnswers(r.data.questions.map(() => null));
      setSecondsLeft(r.data.questions.length * 60);
      setPhase('running');
    }
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy || done) return;
    const before = turns;
    setTurns([...before, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    const r = await apiRequest<{ reply: string; done: boolean }>('/api/coach/chat', {
      method: 'POST', body: { skill: skill.id, inputs: values, history: before, message },
    });
    setBusy(false);
    if (!r.ok) { setTurns(before); setInput(message); return alertApiError(r); }
    setTurns((t) => [...t, { role: 'assistant', content: r.data.reply }]);
    if (r.data.done) setDone(true);
  };

  const shareReply = () => Share.share({ message: reply }).catch(() => {});
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;

  const input_ = { backgroundColor: colors.card, borderRadius: 12, padding: 13, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border };
  const primaryBtn = { minHeight: 50, borderRadius: 14, backgroundColor: skill.color, alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <View ref={rootRef} collapsable={false} onLayout={onLayout} style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, paddingBottom: pad > 0 ? pad : insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
          <TouchableOpacity onPress={leave} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{skill.title}</Text>
          {phase === 'running' && skill.kind === 'test' ? (
            <View style={{ backgroundColor: secondsLeft < 60 ? '#EF444433' : colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: secondsLeft < 60 ? '#EF4444' : colors.text, fontWeight: '800', fontSize: 13 }}>{mmss(secondsLeft)}</Text>
            </View>
          ) : null}
        </View>

        {/* SETUP */}
        {phase === 'setup' ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>{skill.subtitle}</Text>
            {skill.fields.map((f) => (
              <View key={f.key}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 8 }}>
                  {f.label}{f.required ? ' *' : ''}
                </Text>
                <TextInput
                  value={values[f.key] ?? ''}
                  onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textDim}
                  maxLength={f.max}
                  multiline={!!f.multiline}
                  style={{ ...input_, ...(f.multiline ? { minHeight: 120, textAlignVertical: 'top' as const } : {}) }}
                />
              </View>
            ))}
            <TouchableOpacity onPress={start} disabled={busy} accessibilityRole="button" accessibilityLabel="Start" style={{ ...primaryBtn, marginTop: 24, opacity: busy ? 0.7 : 1 }}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{skill.kind === 'report' ? 'Prepare' : 'Start'}</Text>}
            </TouchableOpacity>
            {busy ? <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 }}>The AI is working. This can take up to half a minute.</Text> : null}
            <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 16 }}>{COACH_NOTE}</Text>
          </ScrollView>
        ) : null}

        {/* LIVE PRACTICE */}
        {phase === 'running' && skill.kind === 'chat' ? (
          <>
            <FlatList
              ref={listRef}
              data={turns}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View style={{ alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: item.role === 'user' ? skill.color : colors.card, borderRadius: 16, padding: 12, borderWidth: item.role === 'user' ? 0 : 0.5, borderColor: colors.border }}>
                  <Text selectable style={{ color: item.role === 'user' ? '#fff' : colors.text, fontSize: 14, lineHeight: 21 }}>{item.content}</Text>
                </View>
              )}
              ListFooterComponent={busy ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>Thinking...</Text> : null}
            />
            {done ? (
              <View style={{ padding: 16, gap: 10 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12.5, textAlign: 'center' }}>Session finished.</Text>
                <TouchableOpacity onPress={resetAll} accessibilityRole="button" style={primaryBtn}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Start again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 12, paddingBottom: 8, paddingTop: 6 }}>
                <TouchableOpacity onPress={() => send('END')} disabled={busy} accessibilityRole="button" accessibilityLabel="End and get the scorecard" style={{ alignSelf: 'center', paddingVertical: 6 }}>
                  <Text style={{ color: skill.color, fontSize: 12.5, fontWeight: '700' }}>End now and get my scorecard</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your answer"
                    placeholderTextColor={colors.textDim}
                    multiline
                    maxLength={1500}
                    style={{ ...input_, flex: 1, maxHeight: 130 }}
                  />
                  <TouchableOpacity
                    onPress={() => send(input)}
                    disabled={busy || !input.trim()}
                    accessibilityRole="button"
                    accessibilityLabel="Send"
                    style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: skill.color, alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.5 : 1 }}
                  >
                    {busy ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : null}

        {/* TEST: answering */}
        {phase === 'running' && skill.kind === 'test' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
            {questions.map((q, qi) => (
              <View key={qi} style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 14 }}>
                <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 21 }}>{qi + 1}. {q.q}</Text>
                {q.options.map((o, oi) => {
                  const picked = answers[qi] === oi;
                  return (
                    <TouchableOpacity
                      key={oi}
                      onPress={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                      accessibilityRole="button"
                      accessibilityLabel={`Option ${oi + 1}`}
                      style={{ marginTop: 8, padding: 11, borderRadius: 12, backgroundColor: picked ? skill.color + '33' : colors.bg, borderWidth: 1, borderColor: picked ? skill.color : colors.border }}
                    >
                      <Text style={{ color: colors.text, fontSize: 13.5, lineHeight: 19 }}>{o}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <TouchableOpacity onPress={() => setPhase('result')} accessibilityRole="button" style={primaryBtn}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Submit ({answers.filter((a) => a !== null).length}/{questions.length} answered)</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}

        {/* RESULT: report */}
        {phase === 'result' && skill.kind === 'report' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 14 }}>
              <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{reply}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={shareReply} accessibilityRole="button" style={{ ...primaryBtn, flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Share or copy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetAll} accessibilityRole="button" style={{ ...primaryBtn, flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>Do it again</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>{COACH_NOTE}</Text>
          </ScrollView>
        ) : null}

        {/* RESULT: test review */}
        {phase === 'result' && skill.kind === 'test' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
            <View style={{ alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 18 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>YOUR SCORE</Text>
              <Text style={{ color: skill.color, fontSize: 38, fontWeight: '900' }}>{score}/{questions.length}</Text>
            </View>
            {questions.map((q, qi) => (
              <View key={qi} style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 14 }}>
                <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 21 }}>{qi + 1}. {q.q}</Text>
                {q.options.map((o, oi) => {
                  const right = oi === q.answer;
                  const wrong = answers[qi] === oi && !right;
                  return (
                    <View key={oi} style={{ marginTop: 8, padding: 11, borderRadius: 12, backgroundColor: right ? '#22C55E26' : wrong ? '#EF444426' : colors.bg, borderWidth: 1, borderColor: right ? '#22C55E' : wrong ? '#EF4444' : colors.border }}>
                      <Text style={{ color: colors.text, fontSize: 13.5, lineHeight: 19 }}>{o}</Text>
                    </View>
                  );
                })}
                {answers[qi] === null ? <Text style={{ color: '#F59E0B', fontSize: 12, marginTop: 8 }}>Not answered</Text> : null}
                {q.explain ? <Text style={{ color: colors.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 8 }}>{q.explain}</Text> : null}
              </View>
            ))}
            <TouchableOpacity onPress={resetAll} accessibilityRole="button" style={primaryBtn}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Take another test</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>{COACH_NOTE}</Text>
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
// END OF FILE