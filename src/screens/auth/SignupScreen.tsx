import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

type AuthStackParamList = {
  Login: undefined; Signup: undefined; Main: undefined;
};
type VerifyMethod = 'email' | 'studentId' | 'digitalId';

const COLLEGE_IMAGES: Record<string, string> = {
  'iit': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  'nit': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
  'bits': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  'mumbai': 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&q=80',
  'vit': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80',
  'srm': 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
};

const getCollegeImage = (collegeName: string): string => {
  if (collegeName.length < 3) return '';
  const lower = collegeName.toLowerCase();
  for (const key of Object.keys(COLLEGE_IMAGES)) {
    if (key !== 'default' && lower.includes(key)) return COLLEGE_IMAGES[key];
  }
  return COLLEGE_IMAGES['default'];
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

export const SignupScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('email');

  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [course, setCourse] = useState('');
  const [hostel, setHostel] = useState('');
  const [interests, setInterests] = useState('');

  const collegeImage = getCollegeImage(college);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    backText: { color: Colors.text, fontSize: 18 },
    headerTitle: { fontSize: 19, fontWeight: '800', color: Colors.text },
    headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

    // Progress bar
    progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 22 },
    progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },

    // Card — shadow, no border
    card: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginBottom: 16, ...cardShadow },
    stepTitle: { fontSize: 19, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    stepSub: { fontSize: 12.5, color: Colors.textMuted, marginBottom: 18, lineHeight: 19 },

    // Verify method cards — shadow, active = accent tint
    methodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg, borderRadius: 14, padding: 13, marginBottom: 9 },
    methodCardActive: { backgroundColor: Colors.accent + '12' },
    methodIcon: { fontSize: 22 },
    methodText: { flex: 1 },
    methodTitle: { fontWeight: '700', fontSize: 13.5, color: Colors.text },
    methodSub: { fontSize: 11.5, color: Colors.textMuted, marginTop: 2 },
    methodRadio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    methodRadioActive: { borderColor: Colors.accent },
    methodRadioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.accent },

    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 14 },
    label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, marginTop: 4 },

    // Inputs — bg fill, shadow, no border
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 13, paddingHorizontal: 12, marginBottom: 12, ...softShadow },
    inputIcon: { fontSize: 15, marginRight: 8 },
    input: { flex: 1, color: Colors.text, fontSize: 13.5, paddingVertical: 12 },

    // College image preview
    collegePreview: { width: '100%', height: 130, borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
    collegePreviewImage: { borderRadius: 14 },
    collegePreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: 14, borderRadius: 14 },
    collegePreviewText: { fontSize: 17, fontWeight: '900', color: '#fff' },
    collegePreviewSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    // Anon info card — accent tint, shadow
    anonCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: Colors.accent + '12', borderRadius: 14, padding: 14, marginBottom: 18, ...softShadow },
    anonTitle: { fontWeight: '700', fontSize: 13, color: Colors.text, marginBottom: 3 },
    anonSub: { fontSize: 11.5, color: Colors.textMuted, lineHeight: 17 },

    // CTA button — gradient
    nextBtn: { borderRadius: 14, overflow: 'hidden', ...softShadow },
    nextBtnGradient: { paddingVertical: 15, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    loginLink: { alignItems: 'center', marginTop: 10 },
    loginLinkText: { color: Colors.textMuted, fontSize: 13 },
  });

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

  const validateStep1 = () => {
    if (!password || !confirmPassword) { Alert.alert('Missing fields', 'Please fill all fields.'); return false; }
    if (password.length < 8) { Alert.alert('Weak password', 'Password must be at least 8 characters.'); return false; }
    if (password !== confirmPassword) { Alert.alert('Password mismatch', 'Passwords do not match.'); return false; }
    if (verifyMethod === 'email' && !email.includes('@')) { Alert.alert('Invalid email', 'Enter a valid email address.'); return false; }
    if (verifyMethod === 'studentId' && (!studentId.trim() || !studentName.trim() || !phoneNumber.trim())) {
      Alert.alert('Missing fields', 'Please fill Student ID, Name and Phone.'); return false;
    }
    return true;
  };

  const handleStep1 = () => { if (validateStep1()) setStep(2); };

  const handleSignup = async () => {
    if (!college.trim() || !department.trim() || !year.trim()) {
      Alert.alert('Missing fields', 'Please fill College, Department and Year.'); return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://campus-backend-production-2dbb.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifyMethod, email: email || null, studentId: studentId || null, studentName: studentName || null, phoneNumber: phoneNumber || null, password, college, department, year, course: course || null, hostel: hostel || null, interests: interests || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      navigation.navigate('Main' as never);
    } catch (err: any) {
      Alert.alert('Signup failed', err.message || 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
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
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@college.ac.in" placeholderTextColor={Colors.textDim} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </>
              )}

              {verifyMethod === 'studentId' && (
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput style={styles.input} value={studentName} onChangeText={setStudentName} placeholder="As on your ID card" placeholderTextColor={Colors.textDim} />
                  </View>
                  <Text style={styles.label}>Student / Roll Number</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>🪪</Text>
                    <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} placeholder="e.g. 21CS10045" placeholderTextColor={Colors.textDim} />
                  </View>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>📱</Text>
                    <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="10-digit mobile number" placeholderTextColor={Colors.textDim} keyboardType="phone-pad" maxLength={10} />
                  </View>
                </>
              )}

              <Text style={styles.label}>Create Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 8 characters" placeholderTextColor={Colors.textDim} secureTextEntry />
              </View>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" placeholderTextColor={Colors.textDim} secureTextEntry />
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleStep1} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.nextBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.nextBtnText}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>🏫 Your College</Text>
              <Text style={styles.stepSub}>Tell us about yourself so we can connect you with the right people.</Text>

              <Text style={styles.label}>College Name *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🏛️</Text>
                <TextInput style={styles.input} value={college} onChangeText={setCollege} placeholder="e.g. IIT Kharagpur" placeholderTextColor={Colors.textDim} />
              </View>

              {collegeImage ? (
                <ImageBackground source={{ uri: collegeImage }} style={styles.collegePreview} imageStyle={styles.collegePreviewImage}>
                  <View style={styles.collegePreviewOverlay}>
                    <Text style={styles.collegePreviewText}>{college}</Text>
                    <Text style={styles.collegePreviewSub}>Your campus community awaits 🎓</Text>
                  </View>
                </ImageBackground>
              ) : null}

              <Text style={styles.label}>Department *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>📚</Text>
                <TextInput style={styles.input} value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science, Mechanical..." placeholderTextColor={Colors.textDim} />
              </View>
              <Text style={styles.label}>Year / Semester *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>📅</Text>
                <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="e.g. 2nd Year, Semester 3..." placeholderTextColor={Colors.textDim} />
              </View>
              <Text style={styles.label}>Course / Program</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🎓</Text>
                <TextInput style={styles.input} value={course} onChangeText={setCourse} placeholder="e.g. B.Tech, MBA, BSc..." placeholderTextColor={Colors.textDim} />
              </View>
              <Text style={styles.label}>Hostel / Area</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🏠</Text>
                <TextInput style={styles.input} value={hostel} onChangeText={setHostel} placeholder="e.g. Hostel A, PG near campus..." placeholderTextColor={Colors.textDim} />
              </View>
              <Text style={styles.label}>Interests (optional)</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>⚡</Text>
                <TextInput style={styles.input} value={interests} onChangeText={setInterests} placeholder="e.g. Coding, Music, Sports..." placeholderTextColor={Colors.textDim} />
              </View>

              <View style={styles.anonCard}>
                <Text style={{ fontSize: 22 }}>🎭</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonTitle}>You'll appear as CampusOwl#42</Text>
                  <Text style={styles.anonSub}>Random anonymous handle. Your real name is never shown publicly.</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.nextBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>🚀 Create Account</Text>}
                </LinearGradient>
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