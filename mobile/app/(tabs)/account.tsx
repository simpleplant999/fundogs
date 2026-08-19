import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { openWebPath } from '@/lib/open-web';
import { useAuth } from '@/providers/auth-provider';

export default function AccountScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Account</Text>
      <Text style={styles.lead}>Sign in to manage your fundraisers and profile.</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.light.tint} />
      ) : user ? (
        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.organization ? (
            <Text style={styles.org}>
              {user.organization.name} · {user.organization.memberRole === 'ADMIN' ? 'Admin' : 'Member'}
            </Text>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/profile')}>
            <Text style={styles.btnText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/my-campaigns')}>
            <Text style={styles.btnText}>My campaigns</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => openWebPath('/support')}>
            <Text style={styles.btnGhostText}>Support FunDogs (website)</Text>
          </TouchableOpacity>
          {user.role === 'ADMIN' ? (
            <TouchableOpacity style={styles.btnGhost} onPress={() => openWebPath('/admin')}>
              <Text style={styles.btnGhostText}>Open admin (website)</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.btn, { marginTop: 16, backgroundColor: '#b45309' }]}
            onPress={() => void logout()}>
            <Text style={styles.btnText}>Log out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.btnText}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/auth/register')}>
            <Text style={styles.btnSecondaryText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => openWebPath('/terms')}>
            <Text style={styles.link}>Terms & fees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => openWebPath('/support')}>
            <Text style={styles.link}>Support FunDogs</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
  },
  lead: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.subtext,
  },
  card: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  email: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  org: {
    fontSize: 13,
    color: '#115e59',
    fontWeight: '600',
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.background,
  },
  btnSecondaryText: {
    color: Colors.light.text,
    fontWeight: '700',
    fontSize: 15,
  },
  btnGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    color: '#115e59',
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  link: {
    color: '#115e59',
    fontWeight: '600',
    fontSize: 14,
  },
});
