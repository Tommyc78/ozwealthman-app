import { StyleSheet, View } from 'react-native';
import { Panel } from './Panel';
import { Text } from './Text';
import { useWealthTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'positive' | 'warning';
};

export function StatCard({ label, value, helper, tone = 'default' }: Props) {
  const { colors } = useWealthTheme();
  const color = tone === 'positive' ? colors.success : tone === 'warning' ? colors.warning : colors.text;

  return (
    <Panel style={styles.card}>
      <View>
        <Text variant="label" subtle>
          {label.toUpperCase()}
        </Text>
        <Text variant="section" style={{ color, marginTop: 4 }}>
          {value}
        </Text>
      </View>
      {helper ? (
        <Text variant="small" subtle>
          {helper}
        </Text>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 152,
  },
});
