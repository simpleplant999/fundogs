import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '@/constants/Colors';
import type { CampaignTypeId } from '@/lib/types';
import { CAMPAIGN_TYPES, CAMPAIGN_TYPE_LABELS } from '@/lib/campaign-type';

type Props = {
  selected: CampaignTypeId | undefined;
  onChange: (next: CampaignTypeId | undefined) => void;
};

export function CampaignTypeFilterChips({ selected, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onChange(undefined)}>
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All types</Text>
      </TouchableOpacity>
      {CAMPAIGN_TYPES.map((id) => {
        const active = selected === id;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(active ? undefined : id)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {CAMPAIGN_TYPE_LABELS[id]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.card,
    maxWidth: 280,
  },
  chipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  chipTextActive: {
    color: '#fff',
  },
});
