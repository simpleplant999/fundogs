import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CampaignCard } from '@/components/CampaignCard';
import Colors from '@/constants/Colors';
import { fetchPublishedCampaigns, getApiBase } from '@/lib/api';
import { openWebPath } from '@/lib/open-web';
import type { Campaign } from '@/lib/types';

const trustPillars = [
  {
    title: 'Every campaign is reviewed',
    body: 'Our team reviews and verifies each fundraising campaign before it appears publicly.',
    icon: '🔍',
  },
  {
    title: 'Verified people & organizations',
    body: 'Individuals and organizations are verified before they can post a campaign or represent a group.',
    icon: '✅',
  },
  {
    title: 'Zero tolerance for fraud',
    body: 'We take misuse seriously—report concerns via Contact on the website.',
    icon: '🛡️',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchPublishedCampaigns();
    setFeatured(Array.isArray(list) ? list.slice(0, 6) : []);
  }, []);

  useEffect(() => {
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

  const apiConfigured = Boolean(getApiBase());

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Welcome to FunDogs</Text>
        <Text style={styles.h1}>A non-profit platform connecting rescued pets with loving homes</Text>
        <Text style={styles.lead}>
          Focused on international rescue, local rehoming, and community support—with transparent
          fundraising when you support a campaign.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/donate')}>
            <Text style={styles.btnPrimaryText}>Donate now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => openWebPath('/validation')}>
            <Text style={styles.btnSecondaryText}>How verification works</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/organizations')}>
          <Text style={styles.linkInline}>Explore organizations</Text>
        </TouchableOpacity>
        {!apiConfigured ? (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              Set EXPO_PUBLIC_API_URL (same as web NEXT_PUBLIC_API_URL) to load live campaigns.
            </Text>
          </View>
        ) : (
          <View style={styles.peace}>
            <Text style={styles.peaceText}>
              <Text style={styles.peaceStrong}>Peace of mind:</Text> we verify organizers and review
              every campaign.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.trustSection}>
        <Text style={styles.h2}>Built on trust—not luck</Text>
        <Text style={styles.trustLead}>
          FunDogs is designed so donors and families can support animals with confidence.
        </Text>
        {trustPillars.map((item, index) => (
          <View key={item.title} style={styles.pillar}>
            <Text style={styles.pillarIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pillarStep}>Step {index + 1}</Text>
              <Text style={styles.pillarTitle}>{item.title}</Text>
              <Text style={styles.pillarBody}>{item.body}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.btnPrimary} onPress={() => openWebPath('/validation')}>
          <Text style={styles.btnPrimaryText}>Read the full verification process</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openWebPath('/contact')} style={{ marginTop: 12 }}>
          <Text style={styles.linkMuted}>Report a problem</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featuredSection}>
        <View style={styles.featuredHeader}>
          <View>
            <Text style={styles.h2}>Fundraising campaigns</Text>
            <Text style={styles.featuredSub}>Approved fundraisers from our team.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/donate')}>
            <Text style={styles.linkInline}>Browse all →</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={Colors.light.tint} />
        ) : featured.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No published campaigns yet</Text>
            <Text style={styles.emptyBody}>
              When approved campaigns go live, they will appear here—or browse on the Donate tab.
            </Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/donate')}>
              <Text style={styles.btnPrimaryText}>Visit the donate hub</Text>
            </TouchableOpacity>
          </View>
        ) : (
          featured.map((c) => (
            <View key={c.id} style={{ marginBottom: 16 }}>
              <CampaignCard campaign={c} />
            </View>
          ))
        )}
      </View>

      <View style={styles.mission}>
        <Text style={styles.h2}>Our mission</Text>
        <Text style={styles.bullet}>· Rescue cats and dogs from abuse globally.</Text>
        <Text style={styles.bullet}>· Bring them safely to the Philippines for rehabilitation.</Text>
        <Text style={styles.bullet}>· Find each animal a safe, loving forever home.</Text>
        <Text style={styles.bullet}>· Empower donors and rescue partners through transparency.</Text>
      </View>

      <View style={styles.footerBand}>
        <Text style={styles.footerTitle}>Thank you</Text>
        <Text style={styles.footerLead}>Together, we&apos;re making tails wag and hearts full.</Text>
        <Text style={styles.footerTag}>🐾 FunDogs: Rescue. Rehome. Rebuild.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.cardBorder,
    backgroundColor: '#fffbeb',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#115e59',
    textTransform: 'uppercase',
  },
  h1: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
    lineHeight: 34,
  },
  lead: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.subtext,
  },
  heroActions: {
    marginTop: 20,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  btnSecondaryText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700',
  },
  linkInline: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#115e59',
    textDecorationLine: 'underline',
  },
  linkMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  warn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(180,83,9,0.25)',
  },
  warnText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.subtext,
  },
  peace: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.2)',
  },
  peaceText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.subtext,
  },
  peaceStrong: {
    fontWeight: '700',
    color: '#134e4a',
  },
  trustSection: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.cardBorder,
    backgroundColor: '#fff',
  },
  h2: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  trustLead: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.subtext,
  },
  pillar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pillarIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  pillarStep: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#115e59',
    textTransform: 'uppercase',
  },
  pillarTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  pillarBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
  },
  featuredSection: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  featuredSub: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.subtext,
    maxWidth: 260,
  },
  empty: {
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(120, 53, 15, 0.25)',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.subtext,
    textAlign: 'center',
  },
  mission: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 12,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.subtext,
    paddingLeft: 4,
  },
  footerBand: {
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingVertical: 36,
    backgroundColor: '#422006',
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fffbeb',
  },
  footerLead: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,250,243,0.92)',
    textAlign: 'center',
  },
  footerTag: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '700',
    color: '#fffbeb',
  },
});
