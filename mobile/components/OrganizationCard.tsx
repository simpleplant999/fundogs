import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import type { PublicOrganizationListItem } from '@/lib/api';
import { getApiBase } from '@/lib/api';
import { resolveMediaUrlToApiOrigin } from '@/lib/campaign-images';

export function OrganizationCard({ org }: { org: PublicOrganizationListItem }) {
  const apiBase = getApiBase();
  const raw = org.profilePhotoUrl?.trim() ?? '';
  const photo = raw ? resolveMediaUrlToApiOrigin(apiBase, raw) : '';

  return (
    <Link href={`/organizations/${org.slug}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.photoWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.paw}>🐾</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified partner</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{org.name}</Text>
          {org.bio ? (
            <Text style={styles.bio} numberOfLines={4}>
              {org.bio}
            </Text>
          ) : (
            <Text style={styles.bioEmpty}>No description yet.</Text>
          )}
          <Text style={styles.members}>
            {org.memberCount === 1 ? '1 member' : `${org.memberCount} members`}
          </Text>
        </View>
      </Pressable>
    </Link>
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
    marginBottom: 16,
  },
  photoWrap: {
    aspectRatio: 1,
    backgroundColor: '#fef3c7',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paw: {
    fontSize: 42,
    opacity: 0.35,
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#115e59',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  body: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.subtext,
  },
  bioEmpty: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.light.muted,
  },
  members: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.muted,
  },
});
