import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OrganizationCard } from '@/components/OrganizationCard';
import Colors from '@/constants/Colors';
import { fetchOrganizations } from '@/lib/api';
import type { PublicOrganizationListItem } from '@/lib/api';

export default function OrganizationsScreen() {
  const [orgs, setOrgs] = useState<PublicOrganizationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const data = await fetchOrganizations();
    if (data === null) {
      setError(true);
      setOrgs([]);
    } else {
      setOrgs(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
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
      <Text style={styles.h1}>Organizations</Text>
      <Text style={styles.lead}>
        Rescue groups and chapters on FunDogs. Open a profile to learn more or support their
        campaigns.
      </Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={Colors.light.tint} />
      ) : error ? (
        <Text style={styles.empty}>Organizations could not be loaded. Pull to retry.</Text>
      ) : orgs.length === 0 ? (
        <Text style={styles.empty}>No organizations yet.</Text>
      ) : (
        orgs.map((org) => <OrganizationCard key={org.id} org={org} />)
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
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
    maxWidth: 520,
  },
  empty: {
    marginTop: 28,
    fontSize: 15,
    color: Colors.light.muted,
    lineHeight: 22,
  },
});
