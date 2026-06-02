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

const DEPARTMENTS = [
  'Computer Science', 'Electrical', 'Mechanical',
  'Civil', 'Chemical', 'Mathematics', 'Physics', 'Other',
];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
type VerifyMethod = 'email' | 'studentId' | 'digitalId';

export const SignupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const validateStep1 = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill all fields.'); return false;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.'); return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.'); return false;
    }
    if (verifyMethod === 'email' && !email.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.'); return false;
    }
    if (verifyMethod === 'studentId' && (!studentId.trim() || !studentName.trim() || !phoneNumber.trim())) {
      Alert.alert('Missing fields', 'Please fill Student ID, Name and Phone.'); return false;
    }
    return true;
  };

  const handleStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSignup = async () => {
    if (!college.trim() || !department || !year) {
      Alert.alert('Missing fields', 'Please fill all fields.'); return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://campus-backend-production-2dbb.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifyMethod,
          email: email || null,
          studentId: studentId || null,
          studentName: studentName || null,
          phoneNumber: phoneNumber || null,
          password,
          college,
          department,
          year,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');

      // Save token and navigate directly to app
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      navigation.navigate('Main' as never);
    } catch (err: any) {
      Alert.alert('Signup failed', err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const MethodCard = ({ method, icon, title, sub }: { method: VerifyMethod; icon: string; title: string; sub: string }) => (
    <TouchableOpacity
      style={[styles.methodCard, verifyMethod === method && styles.methodCardActive]}
      onPress={() => setVerifyMethod(method)}
    >
      <Text style={styles.methodIcon}>{icon}</Text>
      <View style={styles.methodText}>
        <Text style={[styles.methodTitle, verifyMethod === method && { color: Colors.accent }]}>{title}</Text>
        <Text style={styles.methodSub}>{sub}</Text>
      </View>
      <View style={[styles.methodRadio, verifyMethod === method && styles.methodRadioActive]}>
        {verifyMethod === method && <View style={styles.methodRadioDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSub}>Step {step} of 2</Text>
            </View>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>

          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Verify you're a student</Text>
              <Text style={styles.stepSub}>Choose how you want to verify your college identity</Text>

              <MethodCard method="email" icon="✉️" title="College Email" sub="Use your .ac.in or institute email" />
              <MethodCard method="studentId" icon="🪪" title="Student ID Number" sub="Enter your enrollment / roll number" />
              <MethodCard method="digitalId" icon="📱" title="Digital ID Card" sub="Upload a photo of your college ID" />

              <View style={styles.divider} />

              {verifyMethod === 'email' && (
                <>
                  <Text style={styles.label}>College Email</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail}
                      placeholder="you@college.ac.in" placeholderTextColor={Colors.textDim}
                      keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </>
              )}

              {verifyMethod === 'studentId' && (
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput style={styles.input} value={studentName} onChangeText={setStudentName}
                      placeholder="As on your ID card" placeholderTextColor={Colors.textDim} />
                  </View>
                  <Text style={styles.label}>Student / Roll Number</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>🪪</Text>
                    <TextInput style={styles.input} value={studentId} onChangeText={setStudentId}
                      placeholder="e.g. 21CS10045" placeholderTextColor={Colors.textDim} />
                  </View>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>📱</Text>
                    <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber}
                      placeholder="10-digit mobile number" placeholderTextColor={Colors.textDim}
                      keyboardType="phone-pad" maxLength={10} />
                  </View>
                </>
              )}

              <Text style={styles.label}>Create Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword}
                  placeholder="Min 8 characters" placeholderTextColor={Colors.textDim} secureTextEntry />
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
                  placeholder="Repeat your password" placeholderTextColor={Colors.textDim} secureTextEntry />
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleStep1}>
                <Text style={styles.nextBtnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>🏫 Your College</Text>
              <Text style={styles.stepSub}>Listings are shown only to students from the same campus.</Text>

              <Text style={styles.label}>College Name</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🏛️</Text>
                <TextInput style={styles.input} value={college} onChangeText={setCollege}
                  placeholder="e.g. IIT Kharagpur" placeholderTextColor={Colors.textDim} />
              </View>

              <Text style={styles.label}>Department</Text>
              <View style={styles.pillGrid}>
                {DEPARTMENTS.map(dept => (
                  <TouchableOpacity key={dept}
                    style={[styles.pill, department === dept && styles.pillActive]}
                    onPress={() => setDepartment(dept)}>
                    <Text style={[styles.pillText, department === dept && styles.pillTextActive]}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Year</Text>
              <View style={styles.pillGrid}>
                {YEARS.map(y => (
                  <TouchableOpacity key={y}
                    style={[styles.pill, year === y && styles.pillActive]}
                    onPress={() => setYear(y)}>
                    <Text style={[styles.pillText, year === y && styles.pillTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.anonCard}>
                <Text style={{ fontSize: 24 }}>🎭</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonTitle}>You'll appear as CampusOwl#42</Text>
                  <Text style={styles.anonSub}>Random anonymous handle. Your real name is never shown publicly.</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, loading && { opacity: 0.7 }]}
                onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>🚀 Create Account</Text>}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ color: Colors.accent }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  backText: { color: Colors.text, fontSize: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 24 },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  card: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  stepSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 20, lineHeight: 20 },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  methodCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '0F' },
  methodIcon: { fontSize: 24 },
  methodText: { flex: 1 },
  methodTitle: { fontWeight: '700', fontSize: 14, color: Colors.text },
  methodSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  methodRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  methodRadioActive: { borderColor: Colors.accent },
  methodRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, marginBottom: 14 },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 12 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 7 },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  anonCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: Colors.accent + '12', borderRadius: 12, borderWidth: 1, borderColor: Colors.accent + '33', padding: 14, marginBottom: 20 },
  anonTitle: { fontWeight: '700', fontSize: 13, color: Colors.text, marginBottom: 4 },
  anonSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  nextBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginLinkText: { color: Colors.textMuted, fontSize: 13 },
});