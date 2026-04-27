import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

type Props = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="section">{title}</Text>
      {action ? (
        <Text variant="small" subtle weight="800">
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
    justifyContent: 'space-between',
  },
});
