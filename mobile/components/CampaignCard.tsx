import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import type { Campaign } from '@/lib/types';
import { getCampaignImages, resolveMediaUrlToApiOrigin } from '@/lib/campaign-images';
import { getCampaignTypeLabel } from '@/lib/campaign-type';
import { formatPhp } from '@/lib/format-currency';
import { getApiBase } from '@/lib/api';

import { ProgressBar } from './ProgressBar';

function StatusChip({ status }: { status: Campaign['status'] }) {
  const palette: Record<Campaign['status'], { bg: string; text: string }> = {
    Published: { bg: '#ccfbf1', text: '#134e4a' },
    Draft: { bg: '#f4f4f5', text: '#3f3f46' },
    Archived: { bg: '#fef3c7', text: '#78350f' },
    Done: { bg: '#d1fae5', text: '#065f46' },
  };
  const p = palette[status];
  return (
    <View style={[styles.chip, { backgroundColor: p.bg }]}>
      <Text style={[styles.chipText, { color: p.text }]}>{status}</Text>
    </View>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const apiBase = getApiBase();
  const heroRaw = getCampaignImages(campaign).filter(Boolean)[0] ?? '';
  const heroSrc = heroRaw ? resolveMediaUrlToApiOrigin(apiBase, heroRaw) : '';

  return (
    <View style={styles.card}>
      <Link href={`/campaign/${campaign.slug}`} asChild>
        <Pressable>
          <View style={styles.imageWrap}>
            {heroSrc ? (
              <Image source={{ uri: heroSrc }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>No image</Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getCampaignTypeLabel(campaign)}</Text>
            </View>
          </View>
        </Pressable>
      </Link>
      <View style={styles.body}>
        <StatusChip status={campaign.status} />
        <Link href={`/campaign/${campaign.slug}`} asChild>
          <Pressable>
            <Text style={styles.title}>{campaign.title}</Text>
          </Pressable>
        </Link>
        <Text style={styles.desc} numberOfLines={2}>
          {campaign.description}
        </Text>
        {campaign.author ? (
          <Text style={styles.meta}>
            <Text style={styles.metaStrong}>{campaign.author.fullName}</Text>
            {campaign.author.organization ? (
              <>
                {' · '}
                <Text style={styles.metaOrg}>{campaign.author.organization.name}</Text>
              </>
            ) : null}
          </Text>
        ) : null}
        <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} />
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Raised</Text>
            <Text style={styles.amountRaised}>{formatPhp(campaign.raisedAmount)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountLabel}>Goal</Text>
            <Text style={styles.amountGoal}>{formatPhp(campaign.goalAmount)}</Text>
          </View>
        </View>
        <Link href={`/campaign/${campaign.slug}`} asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>View campaign</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
    overflow: 'hidden',
    shadowColor: '#451a03',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    aspectRatio: 16 / 10,
    backgroundColor: '#fef3c7',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.light.muted,
    fontSize: 13,
  },
  typeBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: '90%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#134e4a',
  },
  body: {
    padding: 16,
    gap: 10,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 22,
  },
  desc: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  metaStrong: {
    fontWeight: '600',
    color: '#115e59',
  },
  metaOrg: {
    fontWeight: '500',
    color: '#115e59',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.light.muted,
    textTransform: 'uppercase',
  },
  amountRaised: {
    fontSize: 14,
    fontWeight: '700',
    color: '#115e59',
    marginTop: 2,
  },
  amountGoal: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  cta: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.light.text,
  },
  ctaText: {
    color: '#fffaf3',
    fontSize: 14,
    fontWeight: '600',
  },
});
