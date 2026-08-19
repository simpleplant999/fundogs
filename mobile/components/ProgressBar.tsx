import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';

type Props = {
  raised: number;
  goal: number;
};

export function ProgressBar({ raised, goal }: Props) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
  },
});
