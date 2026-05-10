import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from './Text';

type Props = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: Props) {
  const { width } = useWindowDimensions();
  const isCompact = width < 430;

  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <Text variant="section" style={[styles.title, isCompact && styles.titleCompact]}>
        {title}
      </Text>
      {action ? (
        <Text variant="small" subtle weight="800" style={[styles.action, isCompact && styles.actionCompact]}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  rowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  title: {
    flex: 1,
  },
  titleCompact: {
    flex: 0,
  },
  action: {
    flexShrink: 1,
    textAlign: 'right',
  },
  actionCompact: {
    textAlign: 'left',
  },
});
