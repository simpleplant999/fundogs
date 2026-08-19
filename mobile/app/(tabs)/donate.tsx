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
import { CampaignTypeFilterChips } from '@/components/CampaignTypeFilterChips';
import Colors from '@/constants/Colors';
import { fetchPublishedCampaigns } from '@/lib/api';
import type { Campaign, CampaignTypeId } from '@/lib/types';

export default function DonateScreen() {
  const [typeFilter, setTypeFilter] = useState<CampaignTypeId | undefined>(undefined);
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const remote = await fetchPublishedCampaigns(typeFilter);
    setList(Array.isArray(remote) ? remote : []);
  }, [typeFilter]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.h1}>Donate now</Text>
      <Text style={styles.lead}>Pick a campaign to see the full story and donor wall.</Text>
      <View style={{ marginTop: 16 }}>
        <CampaignTypeFilterChips selected={typeFilter} onChange={setTypeFilter} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={Colors.light.tint} />
      ) : (
        <>
          {list.map((c) => (
            <View key={c.id} style={{ marginTop: 16 }}>
              <CampaignCard campaign={c} />
            </View>
          ))}
          {!list.length ? (
            <Text style={styles.empty}>
              No campaigns match this type right now. Try another filter or check back soon.
            </Text>
          ) : null}
        </>
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
  empty: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 21,
  },
});
