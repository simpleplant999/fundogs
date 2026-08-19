import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CampaignCard } from '@/components/CampaignCard';
import Colors from '@/constants/Colors';
import {
  fetchOrganizationBySlug,
  fetchOrganizationCampaigns,
  getApiBase,
  type PublicOrganizationDetail,
} from '@/lib/api';
import type { Campaign } from '@/lib/types';
import { resolveMediaUrlToApiOrigin } from '@/lib/campaign-images';

export default function OrganizationDetailScreen() {
  const navigation = useNavigation();
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0] ?? '';
  const apiBase = getApiBase();

  const [org, setOrg] = useState<PublicOrganizationDetail | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    if (!slug) {
      setMissing(true);
      setLoading(false);
      return;
    }
    const [o, c] = await Promise.all([
      fetchOrganizationBySlug(slug),
      fetchOrganizationCampaigns(slug),
    ]);
    if (!o) {
      setMissing(true);
      setOrg(null);
    } else {
      setOrg(o);
      setMissing(false);
    }
    setCampaigns(Array.isArray(c) ? c : []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useLayoutEffect(() => {
    if (org?.name) navigation.setOptions({ title: org.name });
  }, [org?.name, navigation]);

  const profileSrc = org?.profilePhotoUrl?.trim()
    ? resolveMediaUrlToApiOrigin(apiBase, org.profilePhotoUrl)
    : '';
  const coverSrc = org?.coverPhotoUrl?.trim()
    ? resolveMediaUrlToApiOrigin(apiBase, org.coverPhotoUrl)
    : '';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (missing || !org) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>Organization not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {coverSrc ? (
        <Image source={{ uri: coverSrc }} style={styles.cover} resizeMode="cover" />
      ) : null}
      <View style={styles.headerRow}>
        {profileSrc ? (
          <Image source={{ uri: profileSrc }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPh]}>
            <Text style={styles.avatarPhText}>🐾</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{org.name}</Text>
          <Text style={styles.members}>
            {org.memberCount === 1 ? '1 member' : `${org.memberCount} members`}
          </Text>
        </View>
      </View>
      {org.bio ? <Text style={styles.bio}>{org.bio}</Text> : (
        <Text style={styles.bioEmpty}>No description yet.</Text>
      )}
      <Text style={styles.section}>Campaigns</Text>
      {!campaigns.length ? (
        <Text style={styles.none}>No public campaigns from this group yet.</Text>
      ) : (
        campaigns.map((c) => (
          <View key={c.id} style={{ marginBottom: 16 }}>
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  err: {
    fontSize: 16,
    color: Colors.light.subtext,
  },
  cover: {
    width: '100%',
    height: 160,
    backgroundColor: '#fef3c7',
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.light.card,
    backgroundColor: '#fef3c7',
  },
  avatarPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhText: {
    fontSize: 28,
    opacity: 0.45,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  members: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '600',
  },
  bio: {
    marginHorizontal: 20,
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.subtext,
  },
  bioEmpty: {
    marginHorizontal: 20,
    marginTop: 16,
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.light.muted,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 28,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  none: {
    marginHorizontal: 20,
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.muted,
  },
});
