import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useWealthTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'warning' | 'danger';
};

export function MetricRow({ label, value, tone = 'default' }: Props) {
  const { colors } = useWealthTheme();
  const color =
    tone === 'positive' ? colors.success : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.text;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text subtle>{label}</Text>
      <Text weight="800" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
});
