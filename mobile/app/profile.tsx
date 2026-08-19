import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, updateMe } = useAuth();
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  if (!loading && !user) {
    return null;
  }

  const onSave = async () => {
    if (!user) return;
    const trimmedName = (fullName || user.fullName).trim();
    setBusy(true);
    try {
      const patch: Parameters<typeof updateMe>[0] = {};
      if (trimmedName && trimmedName !== user.fullName) {
        patch.fullName = trimmedName;
      }
      if (newPassword.trim()) {
        patch.newPassword = newPassword.trim();
        patch.currentPassword = currentPassword.trim();
      }
      await updateMe(patch);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Profile photo changes are not available in the app yet—use the FunDogs website if you need
          to update your picture.
        </Text>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={fullName || user.fullName}
          onChangeText={setFullName}
          placeholder={user.fullName}
          placeholderTextColor={Colors.light.muted}
        />
        <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
        <Text style={styles.readonly}>{user.email}</Text>
        <Text style={[styles.section, { marginTop: 22 }]}>Change password</Text>
        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Required if setting a new password"
          placeholderTextColor={Colors.light.muted}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>New password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Leave blank to keep current"
          placeholderTextColor={Colors.light.muted}
        />
        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          disabled={busy}
          onPress={() => void onSave()}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save changes</Text>
          )}
        </TouchableOpacity>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.muted,
    marginBottom: 18,
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
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
    backgroundColor: Colors.light.card,
  },
  readonly: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.light.subtext,
  },
  btn: {
    marginTop: 24,
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
