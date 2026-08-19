import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CampaignCard } from '@/components/CampaignCard';
import Colors from '@/constants/Colors';
import { fetchMyCampaigns } from '@/lib/api';
import type { Campaign } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

export default function MyCampaignsScreen() {
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth();
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!token) {
      setList([]);
      return;
    }
    const data = await fetchMyCampaigns(token);
    setList(Array.isArray(data) ? data : []);
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      setLoading(false);
      setList([]);
      return;
    }
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [authLoading, user, token, load]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load, token]);

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.light.tint} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.lead}>Campaigns you run or manage on FunDogs.</Text>
      <Text style={styles.sub}>
        Creating or editing campaigns still happens on the website for now—open FunDogs in your
        browser for full controls.
      </Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.light.tint} />
      ) : !list.length ? (
        <Text style={styles.empty}>You don&apos;t have any campaigns yet.</Text>
      ) : (
        list.map((c) => (
          <View key={c.id} style={{ marginTop: 16 }}>
            <CampaignCard campaign={c} />
          </View>
        ))
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  lead: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
  },
  empty: {
    marginTop: 28,
    fontSize: 15,
    color: Colors.light.muted,
  },
});
