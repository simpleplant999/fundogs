import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useAuth } from '@/providers/auth-provider';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await register(fullName.trim(), email.trim(), password, inviteCode.trim() || undefined);
      router.back();
    } catch (e) {
      Alert.alert('Could not register', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={Colors.light.muted}
          />
          <Text style={[styles.label, { marginTop: 14 }]}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.light.muted}
          />
          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Choose a password"
            placeholderTextColor={Colors.light.muted}
          />
          <Text style={[styles.label, { marginTop: 14 }]}>Invite code (optional)</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="If your rescue shared one"
            placeholderTextColor={Colors.light.muted}
          />
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={() => void onSubmit()}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  btn: {
    marginTop: 22,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
