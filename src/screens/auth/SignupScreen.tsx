import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Alert, ImageBackground,
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

type AuthStackParamList = {
  Login: undefined; Signup: undefined; Main: undefined;
};
type VerifyMethod = 'email' | 'studentId' | 'digitalId';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

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

// Kept outside SignupScreen on purpose: a component defined inside would be rebuilt on every
// keystroke and close the keyboard.
const Field = ({ icon, children }: { icon: IconName; children: React.ReactNode }) => {
  const Colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg,
        borderRadius: 13, paddingHorizontal: 12, marginBottom: 12, ...softShadow,
      }}
    >
      <Ionicons name={icon} size={17} color={Colors.textMuted} style={{ marginRight: 8 }} />
      {children}
    </View>
  );
};

export const SignupScreen = () => {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const { rootRef, onLayout, pad } = useKeyboardPadding();
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

    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    headerTitle: { fontSize: 19, fontWeight: '800', color: Colors.text },
    headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

    progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 22 },
    progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },

    card: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginBottom: 16, ...cardShadow },
    stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    stepTitle: { fontSize: 19, fontWeight: '800', color: Colors.text },
    stepSub: { fontSize: 12.5, color: Colors.textMuted, marginBottom: 18, lineHeight: 19 },

    methodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg, borderRadius: 14, padding: 13, marginBottom: 9 },
    methodCardActive: { backgroundColor: Colors.accent + '12' },
    methodIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
    methodText: { flex: 1 },
    methodTitle: { fontWeight: '700', fontSize: 13.5, color: Colors.text },
    methodSub: { fontSize: 11.5, color: Colors.textMuted, marginTop: 2 },
    methodRadio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    methodRadioActive: { borderColor: Colors.accent },
    methodRadioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.accent },

    idNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.accent + '12', borderRadius: 12, padding: 12, marginTop: 4 },
    idNoteText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 14 },
    label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, marginTop: 4 },

    input: { flex: 1, color: Colors.text, fontSize: 13.5, paddingVertical: 12 },

    collegePreview: { width: '100%', height: 130, borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
    collegePreviewImage: { borderRadius: 14 },
    collegePreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: 14, borderRadius: 14 },
    collegePreviewText: { fontSize: 17, fontWeight: '900', color: '#fff' },
    collegePreviewSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    anonCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: Colors.accent + '12', borderRadius: 14, padding: 14, marginBottom: 18, ...softShadow },
    anonTitle: { fontWeight: '700', fontSize: 13, color: Colors.text, marginBottom: 3 },
    anonSub: { fontSize: 11.5, color: Colors.textMuted, lineHeight: 17 },

    nextBtn: { borderRadius: 14, overflow: 'hidden', ...softShadow },
    nextBtnGradient: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    loginLink: { alignItems: 'center', marginTop: 10, minHeight: 40, justifyContent: 'center' },
    loginLinkText: { color: Colors.textMuted, fontSize: 13 },
  });

  const MethodCard = ({ method, icon, title, sub }: { method: VerifyMethod; icon: IconName; title: string; sub: string }) => (
    <TouchableOpacity
      style={[styles.methodCard, verifyMethod === method && styles.methodCardActive]}
      onPress={() => setVerifyMethod(method)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.methodIconWrap}>
        <Ionicons name={icon} size={20} color={verifyMethod === method ? Colors.accent : Colors.textMuted} />
      </View>
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
      const response = await fetch('https://campus-backend-arfy.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifyMethod,
          email: email.trim() || null,
          studentId: studentId.trim() || null,
          studentName: studentName.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          password,
          college: college.trim(),
          department: department.trim(),
          year: year.trim(),
          course: course.trim() || null,
          hostel: hostel.trim() || null,
          interests: interests.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      navigation.navigate('Main' as never);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Network')) {
        Alert.alert('Could not reach the server', 'The server may be waking up. Please try again in a minute.');
      } else {
        Alert.alert('Signup failed', msg || 'Something went wrong. Try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={onLayout}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={{ flex: 1, paddingBottom: pad }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
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
              <Text style={[styles.stepSub, { marginTop: 4 }]}>Choose how you want to sign up</Text>
              <MethodCard method="email" icon="mail-outline" title="College Email" sub="Use your .ac.in or institute email" />
              <MethodCard method="studentId" icon="card-outline" title="Student ID Number" sub="Enter your enrollment / roll number" />
              <MethodCard method="digitalId" icon="phone-portrait-outline" title="Digital ID Card" sub="You will upload the ID photo after signing up" />

              <View style={styles.idNote}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent} />
                <Text style={styles.idNoteText}>
                  After signing up, upload a photo of your college ID in Profile, Student verification.
                  You get the Verified badge once it is approved.
                </Text>
              </View>
              <View style={styles.divider} />

              {verifyMethod === 'email' && (
                <>
                  <Text style={styles.label}>College Email</Text>
                  <Field icon="mail-outline">
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@college.ac.in" placeholderTextColor={Colors.textDim} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  </Field>
                </>
              )}

              {verifyMethod === 'studentId' && (
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <Field icon="person-outline">
                    <TextInput style={styles.input} value={studentName} onChangeText={setStudentName} placeholder="As on your ID card" placeholderTextColor={Colors.textDim} />
                  </Field>
                  <Text style={styles.label}>Student / Roll Number</Text>
                  <Field icon="card-outline">
                    <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} placeholder="e.g. 21CS10045" placeholderTextColor={Colors.textDim} autoCapitalize="characters" />
                  </Field>
                  <Text style={styles.label}>Phone Number</Text>
                  <Field icon="call-outline">
                    <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="10-digit mobile number" placeholderTextColor={Colors.textDim} keyboardType="phone-pad" maxLength={10} />
                  </Field>
                </>
              )}

              <Text style={styles.label}>Create Password</Text>
              <Field icon="lock-closed-outline">
                <PasswordInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 8 characters" placeholderTextColor={Colors.textDim} />
              </Field>
              <Text style={styles.label}>Confirm Password</Text>
              <Field icon="lock-closed-outline">
                <PasswordInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" placeholderTextColor={Colors.textDim} />
              </Field>

              <TouchableOpacity style={styles.nextBtn} onPress={handleStep1} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Continue">
                <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.nextBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <View style={styles.stepTitleRow}>
                <Ionicons name="business-outline" size={20} color={Colors.text} />
                <Text style={styles.stepTitle}>Your College</Text>
              </View>
              <Text style={styles.stepSub}>Tell us about yourself so we can connect you with the right people.</Text>

              <Text style={styles.label}>College Name *</Text>
              <Field icon="business-outline">
                <TextInput style={styles.input} value={college} onChangeText={setCollege} placeholder="e.g. IIT Kharagpur" placeholderTextColor={Colors.textDim} />
              </Field>

              {collegeImage ? (
                <ImageBackground source={{ uri: collegeImage }} style={styles.collegePreview} imageStyle={styles.collegePreviewImage}>
                  <View style={styles.collegePreviewOverlay}>
                    <Text style={styles.collegePreviewText}>{college}</Text>
                    <Text style={styles.collegePreviewSub}>Your campus community awaits</Text>
                  </View>
                </ImageBackground>
              ) : null}

              <Text style={styles.label}>Department *</Text>
              <Field icon="library-outline">
                <TextInput style={styles.input} value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science, Mechanical..." placeholderTextColor={Colors.textDim} />
              </Field>
              <Text style={styles.label}>Year / Semester *</Text>
              <Field icon="calendar-outline">
                <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="e.g. 2nd Year, Semester 3..." placeholderTextColor={Colors.textDim} />
              </Field>
              <Text style={styles.label}>Course / Program</Text>
              <Field icon="school-outline">
                <TextInput style={styles.input} value={course} onChangeText={setCourse} placeholder="e.g. B.Tech, MBA, BSc..." placeholderTextColor={Colors.textDim} />
              </Field>
              <Text style={styles.label}>Hostel / Area</Text>
              <Field icon="home-outline">
                <TextInput style={styles.input} value={hostel} onChangeText={setHostel} placeholder="e.g. Hostel A, PG near campus..." placeholderTextColor={Colors.textDim} />
              </Field>
              <Text style={styles.label}>Interests (optional)</Text>
              <Field icon="flash-outline">
                <TextInput style={styles.input} value={interests} onChangeText={setInterests} placeholder="e.g. Coding, Music, Sports..." placeholderTextColor={Colors.textDim} />
              </Field>

              <View style={styles.anonCard}>
                <Ionicons name="eye-off-outline" size={22} color={Colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonTitle}>You get a random anonymous handle</Text>
                  <Text style={styles.anonSub}>It is shown to you right after sign up. Your real name is never shown publicly.</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Create account">
                <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.nextBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Create Account</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')} accessibilityRole="button">
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ color: Colors.accent }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </View>
  );
};