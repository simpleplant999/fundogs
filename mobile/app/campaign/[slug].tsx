import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import Colors from '@/constants/Colors';
import {
  fetchCampaignBySlug,
  fetchCampaignUpdates,
  fetchComments,
  fetchDonors,
  getApiBase,
} from '@/lib/api';
import { getCampaignImages, resolveMediaUrlToApiOrigin } from '@/lib/campaign-images';
import { getCampaignTypeLabel } from '@/lib/campaign-type';
import { formatPhp } from '@/lib/format-currency';
import { getWebOriginRaw } from '@/lib/env';
import type { Campaign, CampaignUpdate, Comment, Donor } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

function formatUpdateDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

function canShowDonateWidget(c: Campaign): boolean {
  return c.approvalStatus === 'approved' && (c.status === 'Published' || c.status === 'Done');
}

export default function CampaignDetailScreen() {
  const navigation = useNavigation();
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0] ?? '';
  const { token } = useAuth();
  const apiBase = getApiBase();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setError('Missing campaign link.');
      setLoading(false);
      return;
    }
    setError(null);
    const [c, d, co, u] = await Promise.all([
      fetchCampaignBySlug(slug, token),
      fetchDonors(slug, token),
      fetchComments(slug, token),
      fetchCampaignUpdates(slug, token),
    ]);
    if (!c) {
      setCampaign(null);
      setError('Campaign not found.');
    } else {
      setCampaign(c);
    }
    setDonors(Array.isArray(d) ? d : []);
    const visible = Array.isArray(co) ? co.filter((x) => x.status === 'visible') : [];
    setComments(visible);
    setUpdates(Array.isArray(u) ? u : []);
    setLoading(false);
  }, [slug, token]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useLayoutEffect(() => {
    if (campaign?.title) navigation.setOptions({ title: campaign.title });
  }, [campaign?.title, navigation]);

  const heroRaw = campaign ? getCampaignImages(campaign).filter(Boolean)[0] ?? '' : '';
  const heroSrc = heroRaw ? resolveMediaUrlToApiOrigin(apiBase, heroRaw) : '';

  const openDonateOnWeb = async () => {
    const origin = getWebOriginRaw();
    if (!origin) {
      Alert.alert(
        'Website URL not set',
        'Add EXPO_PUBLIC_WEB_ORIGIN to open the donation checkout in your browser.',
      );
      return;
    }
    await WebBrowser.openBrowserAsync(`${origin}/campaigns/${encodeURIComponent(slug)}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (error || !campaign) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{error ?? 'Not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {heroSrc ? (
          <Image source={{ uri: heroSrc }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImg, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>No image</Text>
          </View>
        )}
      </View>
      <Text style={styles.type}>{getCampaignTypeLabel(campaign)}</Text>
      <Text style={styles.title}>{campaign.title}</Text>
      <Text style={styles.statusHint}>
        {campaign.status === 'Published'
          ? 'Live — accepting donations.'
          : campaign.status === 'Draft'
            ? 'Draft — visible to organizers until approved.'
            : campaign.status === 'Archived'
              ? 'Archived — donations closed.'
              : 'Done — thank you to everyone who gave.'}
      </Text>
      <View style={{ marginHorizontal: 20, marginTop: 14 }}>
        <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} />
      </View>
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amtLabel}>Raised</Text>
          <Text style={styles.amtRaised}>{formatPhp(campaign.raisedAmount)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amtLabel}>Goal</Text>
          <Text style={styles.amtGoal}>{formatPhp(campaign.goalAmount)}</Text>
        </View>
      </View>
      {canShowDonateWidget(campaign) ? (
        <TouchableOpacity style={styles.donateBtn} onPress={() => void openDonateOnWeb()}>
          <Text style={styles.donateBtnText}>Donate in browser</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.closed}>Donations are not open for this campaign in its current state.</Text>
      )}
      <Text style={styles.sectionTitle}>Story</Text>
      <Text style={styles.body}>{campaign.description}</Text>
      {campaign.author ? (
        <Text style={styles.author}>
          Organizer: <Text style={styles.authorStrong}>{campaign.author.fullName}</Text>
          {campaign.author.organization
            ? ` · ${campaign.author.organization.name}`
            : ''}
        </Text>
      ) : null}

      {updates.length ? (
        <>
          <Text style={styles.sectionTitle}>Updates</Text>
          {updates.map((u) => (
            <View key={u.id} style={styles.updateCard}>
              <Text style={styles.updateTitle}>{u.title}</Text>
              <Text style={styles.updateMeta}>{formatUpdateDate(u.createdAt)}</Text>
              <Text style={styles.updateBody}>{u.body}</Text>
            </View>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Supporters</Text>
      {!donors.length ? (
        <Text style={styles.muted}>No public supporters yet.</Text>
      ) : (
        donors.slice(0, 40).map((d) => (
          <View key={d.id} style={styles.donorRow}>
            <Text style={styles.donorName}>{d.name}</Text>
            <Text style={styles.donorAmt}>
              {d.amount === null || d.hideAmount ? '—' : formatPhp(d.amount)}
            </Text>
          </View>
        ))
      )}

      {comments.length ? (
        <>
          <Text style={styles.sectionTitle}>Comments</Text>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{c.author}</Text>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
        </>
      ) : null}
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
    textAlign: 'center',
  },
  hero: {
    marginBottom: 16,
  },
  heroImg: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#fef3c7',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    color: Colors.light.muted,
  },
  type: {
    marginHorizontal: 20,
    fontSize: 12,
    fontWeight: '700',
    color: '#115e59',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
    lineHeight: 30,
  },
  statusHint: {
    marginHorizontal: 20,
    marginTop: 10,
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
  },
  amtLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amtRaised: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#115e59',
  },
  amtGoal: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  donateBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  donateBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  closed: {
    marginHorizontal: 20,
    marginTop: 16,
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 28,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  body: {
    marginHorizontal: 20,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.subtext,
  },
  author: {
    marginHorizontal: 20,
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.muted,
  },
  authorStrong: {
    fontWeight: '700',
    color: '#115e59',
  },
  updateCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  updateMeta: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.light.muted,
  },
  updateBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
  },
  muted: {
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.muted,
  },
  donorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.cardBorder,
  },
  donorName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  donorAmt: {
    fontSize: 14,
    color: '#115e59',
    fontWeight: '700',
  },
  commentCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#115e59',
  },
  commentBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
  },
});
