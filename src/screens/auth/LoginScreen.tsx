import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import PasswordInput from '../../components/PasswordInput';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';
import { authRequest } from '../../utils/authApi';

type AuthStackParamList = {
  Login: undefined; Signup: undefined; Main: undefined;
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

export const LoginScreen = () => {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const { rootRef, onLayout, pad } = useKeyboardPadding();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (slowTimer.current) clearTimeout(slowTimer.current); }, []);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

    logoWrap: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 70, height: 70, borderRadius: 22, overflow: 'hidden', marginBottom: 12, shadowColor: Colors.accent, shadowOpacity: 0.45, shadowRadius: 20, elevation: 10 },
    logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: 26, fontWeight: '900', color: '#fff' },
    appName: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: 0.5 },
    tagline: { fontSize: 12.5, color: Colors.textMuted, marginTop: 4 },

    card: { backgroundColor: Colors.card, borderRadius: 22, padding: 22, marginBottom: 18, ...cardShadow },
    cardTitle: { fontSize: 21, fontWeight: '800', color: Colors.text, marginBottom: 3 },
    cardSub: { fontSize: 12.5, color: Colors.textMuted, marginBottom: 22 },

    label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },

    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 13, paddingHorizontal: 12, ...softShadow },
    inputWrapError: { borderWidth: 1, borderColor: Colors.danger },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, color: Colors.text, fontSize: 13.5, paddingVertical: 12 },
    fieldGap: { marginBottom: 14 },
    errorText: { color: Colors.danger, fontSize: 11.5, marginTop: 5, marginLeft: 4 },

    forgotWrap: { alignItems: 'flex-end', marginBottom: 18, minHeight: 32, justifyContent: 'center' },
    forgotText: { color: Colors.accent, fontSize: 12, fontWeight: '600' },

    slowBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: Colors.accent + '14', borderRadius: 12, padding: 12, marginBottom: 14 },
    slowText: { flex: 1, color: Colors.textMuted, fontSize: 12, lineHeight: 17 },

    loginBtn: { borderRadius: 14, overflow: 'hidden', ...softShadow },
    loginBtnGradient: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
    dividerText: { color: Colors.textDim, fontSize: 12 },

    signupBtn: { backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...softShadow },
    signupBtnText: { color: Colors.text, fontWeight: '700', fontSize: 14.5 },

    privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    privacyNote: { textAlign: 'center', color: Colors.textDim, fontSize: 12, lineHeight: 20 },
  });

  const handleLogin = async () => {
    if (loading) return;
    const id = identifier.trim();
    const next: { identifier?: string; password?: string } = {};
    if (!id) next.identifier = 'Please enter your email or student ID.';
    if (!password) next.password = 'Please enter your password.';
    setErrors(next);
    if (next.identifier || next.password) return;

    setLoading(true);
    setSlow(false);
    slowTimer.current = setTimeout(() => setSlow(true), 6000);

    const result = await authRequest('login', { identifier: id, password });

    if (slowTimer.current) clearTimeout(slowTimer.current);
    setSlow(false);
    setLoading(false);

    if (!result.ok) {
      if (result.field === 'identifier') setErrors({ identifier: result.message });
      else if (result.field === 'password') setErrors({ password: result.message });
      else Alert.alert(result.title, result.message);
      return;
    }

    await AsyncStorage.setItem('token', result.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(result.data.user));
    navigation.navigate('Main' as never);
  };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={onLayout}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={{ flex: 1, paddingBottom: pad }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.logoGradient}>
                <Text style={styles.logoText}>CC</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>CampusConnect</Text>
            <Text style={styles.tagline}>Your college. Your community.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in with your email or student ID</Text>

            <Text style={styles.label}>Email or Student ID</Text>
            <View style={styles.fieldGap}>
              <View style={[styles.inputWrap, !!errors.identifier && styles.inputWrapError]}>
                <Ionicons name="person-outline" size={17} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={(v) => { setIdentifier(v); if (errors.identifier) setErrors((e) => ({ ...e, identifier: undefined })); }}
                  placeholder="you@college.ac.in or 21CS10045"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.fieldGap}>
              <View style={[styles.inputWrap, !!errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={17} color={Colors.textMuted} style={styles.inputIcon} />
                <PasswordInput
                  style={styles.input}
                  value={password}
                  onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textDim}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() => Alert.alert('Password reset', 'Password reset is coming soon.')}
              accessibilityRole="button"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {slow ? (
              <View style={styles.slowBox}>
                <Ionicons name="time-outline" size={18} color={Colors.accent} />
                <Text style={styles.slowText}>The server is waking up. This can take up to a minute the first time. Please wait.</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Sign in">
              <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.loginBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.signupBtn} onPress={() => navigation.navigate('Signup')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.signupBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed" size={13} color={Colors.textDim} />
            <Text style={styles.privacyNote}>Only verified college students can join.</Text>
          </View>
          <Text style={styles.privacyNote}>Your identity stays anonymous on campus.</Text>

        </ScrollView>
      </View>
    </View>
  );
};
// END OF FILE