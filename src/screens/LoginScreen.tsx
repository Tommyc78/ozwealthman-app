import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { useWealthTheme } from '@/theme/ThemeProvider';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { colors } = useWealthTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    if (isSignUp) {
      const { error: err } = await signUp(email, password);
      if (err) { setError(err.message); }
      else {
        setMessage('Check your email to confirm your account, then sign in.');
        setIsSignUp(false);
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err.message); }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={[styles.title, { color: colors.accent }]}>OZWEALTHMAN</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isSignUp ? 'Create your account' : 'Sign in to your command centre'}
          </Text>
        </View>
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {error ? (<View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>) : null}
          {message ? (<View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>) : null}

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="you@example.com" placeholderTextColor={colors.muted} value={email}
            onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />

          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="At least 6 characters" placeholderTextColor={colors.muted} value={password}
            onChangeText={setPassword} secureTextEntry textContentType="password" />

          {isSignUp ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Re-enter password" placeholderTextColor={colors.muted} value={confirmPassword}
                onChangeText={setConfirmPassword} secureTextEntry textContentType="password" />
            </>
          ) : null}

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : (
              <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}>
            <Text style={[styles.switchText, { color: colors.accent }]}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  subtitle: { fontSize: 16, marginTop: 8 },
  form: { borderRadius: 16, borderWidth: 1, padding: 24, maxWidth: 400, width: '100%', alignSelf: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 16, padding: 14 },
  button: { alignItems: 'center', borderRadius: 10, marginTop: 24, padding: 16 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '800' },
  switchButton: { alignItems: 'center', marginTop: 16, padding: 8 },
  switchText: { fontSize: 14 },
  errorBox: { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderRadius: 8, padding: 12 },
  errorText: { color: '#ff3b30', fontSize: 14, textAlign: 'center' },
  messageBox: { backgroundColor: 'rgba(52, 199, 89, 0.15)', borderRadius: 8, padding: 12 },
  messageText: { color: '#34c759', fontSize: 14, textAlign: 'center' },
});
