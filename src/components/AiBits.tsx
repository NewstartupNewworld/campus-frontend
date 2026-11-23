import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../theme/ThemeProvider';
import { useKeyboardPadding } from '../utils/useKeyboardPadding';
import { apiRequest, ApiResult } from '../utils/api';
import { useStudyProfile } from '../utils/study';

export const AI_NOTE = 'AI can make mistakes. This is for study and guidance, not medical or legal advice. Check important facts.';
export type UiError = { title: string; message: string };

/** One request to an AI route. It never throws, and it uses the server's own words for AI problems. */
export async function aiPost<T = any>(path: string, body: unknown): Promise<ApiResult<T>> {
  const r = await apiRequest<T>(path, { method: 'POST', body });
  if (r.ok) return r;
  if (r.status === 429) return { ...r, title: 'AI is busy', message: r.serverMessage || 'Too many requests. Please wait a few minutes and try again.' };
  if (r.status === 502 || r.status === 503 || r.status === 504) {
    return { ...r, title: 'AI is not available', message: r.serverMessage || 'The AI could not answer right now. Please try again in a moment.' };
  }
  return r;
}

/** The student's own field, with its subjects. "addYours" opens the screen where they add their own. */
export function useField() {
  const navigation = useNavigation<any>();
  const { profile } = useStudyProfile();
  return {
    profile,
    label: profile?.label || 'your course',
    subjects: profile?.subjects ?? [],
    addYours: () => navigation.navigate('MyField'),
  };
}

export const inputBox = (colors: any) => ({
  backgroundColor: colors.card, borderRadius: 12, padding: 13, color: colors.text, fontSize: 14,
  borderWidth: 0.5, borderColor: colors.border,
});

export function Page({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { rootRef, onLayout, pad } = useKeyboardPadding();
  return (
    <View ref={rootRef} collapsable={false} onLayout={onLayout} style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, paddingBottom: pad > 0 ? pad : 0 }}>{children}</View>
    </View>
  );
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 8 }}>{children}</Text>;
}

export function Card({ children, tint }: { children: React.ReactNode; tint?: string }) {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: tint ? tint + '15' : colors.card, borderRadius: 16, padding: 16, borderWidth: tint ? 0 : 0.5, borderColor: colors.border, ...(tint ? { borderLeftWidth: 3, borderLeftColor: tint } : {}) }}>
      {children}
    </View>
  );
}

export function Button({ label, onPress, busy, color, disabled }: { label: string; onPress: () => void; busy?: boolean; color: string; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy || disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: 50, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginTop: 20, opacity: busy || disabled ? 0.7 : 1 }}
    >
      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={{ color: '#fff', fontWeight: '700' }}>The AI is working...</Text>
        </View>
      ) : (
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function ErrorCard({ error, onRetry }: { error: UiError | null; onRetry?: () => void }) {
  const colors = useColors();
  if (!error) return null;
  return (
    <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.warn + '1F', borderWidth: 1, borderColor: colors.warn + '55', borderRadius: 14, padding: 12 }}>
      <Ionicons name="alert-circle" size={20} color={colors.warn} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>{error.title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 1 }}>{error.message}</Text>
      </View>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}>
          <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13.5 }}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Note() {
  const colors = useColors();
  return <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 22, lineHeight: 16 }}>{AI_NOTE}</Text>;
}

type ChipsProps = {
  options: string[]; value: string | string[]; onChange: (v: any) => void; color: string;
  sticky?: boolean; onAdd?: () => void; horizontal?: boolean;
};

/** Choose one (value is a string) or many (value is a list). "sticky" stops a single choice from being un-chosen. */
export function Chips({ options, value, onChange, color, sticky, onAdd, horizontal }: ChipsProps) {
  const colors = useColors();
  const on = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  const press = (o: string) => {
    if (Array.isArray(value)) onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
    else onChange(value === o && !sticky ? '' : o);
  };
  const items = options.map((o) => (
    <TouchableOpacity
      key={o}
      onPress={() => press(o)}
      accessibilityRole="button"
      accessibilityLabel={o}
      style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: on(o) ? color : colors.card, borderWidth: 0.5, borderColor: on(o) ? color : colors.border }}
    >
      <Text style={{ color: on(o) ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{o}</Text>
    </TouchableOpacity>
  ));
  const add = onAdd ? (
    <TouchableOpacity
      key="__add"
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel="Add your own"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: color }}
    >
      <Ionicons name="add" size={14} color={color} />
      <Text style={{ color, fontSize: 13, fontWeight: '600' }}>Add yours</Text>
    </TouchableOpacity>
  ) : null;
  if (horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
        {items}{add}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{items}{add}</View>;
}

type ChatProps = {
  title: string; subtitle: string; color: string;
  chips: string[]; onAddChip?: () => void;
  starters: string[]; introTitle: string; introText: string;
  makePayload: (q: string, context: string, chip: string) => Record<string, unknown>;
};

/** A question and answer chat on the shared AI route. Used by Doubt Solver and Senior Guide. */
export function AiChat(p: ChatProps) {
  const colors = useColors();
  const [chip, setChip] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<(UiError & { q: string }) | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const ask = async (raw?: string, retry = false) => {
    const q = (raw ?? text).trim();
    if (!q || loading) return;
    setError(null);
    setText('');
    const prior = retry ? messages.slice(0, -1) : messages;
    if (!retry) setMessages([...messages, { role: 'user', text: q }]);
    setLoading(true);
    const context = prior.slice(-4).map((m) => `${m.role}: ${m.text}`).join('\n');
    const r = await aiPost<{ answer: string }>('/api/ai/doubt', p.makePayload(q, context, chip));
    setLoading(false);
    if (!r.ok) { setError({ title: r.title, message: r.message, q }); return; }
    setMessages((m) => [...m, { role: 'ai', text: r.data.answer }]);
  };

  return (
    <Page>
      <Header
        title={p.title}
        subtitle={p.subtitle}
        right={messages.length > 0 ? (
          <TouchableOpacity onPress={() => { setMessages([]); setError(null); }} accessibilityRole="button" accessibilityLabel="Clear chat" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Clear</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <Chips horizontal options={p.chips} value={chip} onChange={setChip} color={p.color} onAdd={p.onAddChip} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={{ gap: 8 }}>
            <Card tint={p.color}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 }}>{p.introTitle}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>{p.introText}</Text>
            </Card>
            <Label>Try asking</Label>
            {p.starters.map((s) => (
              <TouchableOpacity key={s} onPress={() => ask(s)} activeOpacity={0.8} accessibilityRole="button" style={{ backgroundColor: colors.card, borderRadius: 14, padding: 13, borderWidth: 0.5, borderColor: colors.border }}>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>{s}</Text>
              </TouchableOpacity>
            ))}
            <Note />
          </View>
        ) : (
          messages.map((m, i) => (
            <View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: m.role === 'user' ? p.color : colors.card, borderRadius: 16, padding: 13, borderWidth: m.role === 'ai' ? 0.5 : 0, borderColor: colors.border }}>
              <Text selectable style={{ color: m.role === 'user' ? '#fff' : colors.text, fontSize: 14, lineHeight: 22 }}>{m.text}</Text>
            </View>
          ))
        )}
        {loading ? (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 }}>
            <ActivityIndicator color={p.color} size="small" />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Thinking...</Text>
          </View>
        ) : null}
        <ErrorCard error={error} onRetry={error ? () => ask(error.q, true) : undefined} />
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, paddingBottom: 20, backgroundColor: colors.card }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type here..."
          placeholderTextColor={colors.textDim}
          multiline
          maxLength={500}
          style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 14, padding: 12, color: colors.text, fontSize: 14, maxHeight: 100 }}
        />
        <TouchableOpacity
          onPress={() => ask()}
          disabled={loading || !text.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: text.trim() && !loading ? p.color : colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Page>
  );
}
// END OF FILE