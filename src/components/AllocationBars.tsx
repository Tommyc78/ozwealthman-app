import { StyleSheet, View } from 'react-native';
import { AllocationItem } from '@/services/calculations';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatPercent } from '@/utils/format';
import { Text } from './Text';

type Props = {
  items: AllocationItem[];
};

export function AllocationBars({ items }: Props) {
  const { colors, radius } = useWealthTheme();

  return (
    <View style={styles.wrapper}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={styles.labelRow}>
            <Text weight="800">{item.label}</Text>
            <Text subtle>{formatPercent(item.percent)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceRaised, borderRadius: radius.sm }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(item.percent, 3)}%`,
                  backgroundColor: colors[item.colorKey],
                  borderRadius: radius.sm,
                },
              ]}
            >
              <View style={[styles.fillHighlight, { backgroundColor: `${colors.chartFive}55` }]} />
            </View>
          </View>
          <Text variant="small" subtle>
            {formatCurrency(item.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  item: {
    gap: 6,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 9,
    overflow: 'hidden',
  },
  fill: {
    height: 9,
    overflow: 'hidden',
  },
  fillHighlight: {
    height: 3,
    marginLeft: '8%',
    marginTop: 1,
    width: '72%',
  },
});
