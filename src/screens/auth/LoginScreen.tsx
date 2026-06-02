import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

export const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid college email.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://campus-backend-production-2dbb.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      // Save token and user data
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      navigation.navigate('Main' as never);
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Invalid email or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>CC</Text>
            </View>
            <Text style={styles.appName}>CampusConnect</Text>
            <Text style={styles.tagline}>Your college. Your community.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back 👋</Text>
            <Text style={styles.cardSub}>Sign in with your college email</Text>

            {/* Email */}
            <Text style={styles.label}>College Email</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@iitkharagpur.ac.in"
                placeholderTextColor={Colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textDim}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>Sign In →</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Signup */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            🔒 Only verified college students can join.{'\n'}
            Your identity stays anonymous on campus.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  card: {
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    padding: 24, marginBottom: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 24 },

  label: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, marginBottom: 16,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 12 },
  showHide: { color: Colors.accent, fontSize: 12, fontWeight: '700' },

  forgotWrap: { alignItems: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { color: Colors.accent, fontSize: 12, fontWeight: '600' },

  loginBtn: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textDim, fontSize: 12 },

  signupBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    backgroundColor: Colors.cardAlt,
  },
  signupBtnText: { color: Colors.text, fontWeight: '700', fontSize: 15 },

  privacyNote: {
    textAlign: 'center', color: Colors.textDim,
    fontSize: 12, lineHeight: 20,
  },
});