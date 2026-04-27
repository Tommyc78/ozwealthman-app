import { StyleSheet, View } from 'react-native';
import { Transaction } from '@/types/models';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatDate } from '@/utils/format';
import { Text } from './Text';

type Props = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: Props) {
  const { colors } = useWealthTheme();
  const isPositive = transaction.transaction_type === 'income' || transaction.transaction_type === 'sell';

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.copy}>
        <Text weight="800">{transaction.category}</Text>
        <Text variant="small" subtle>
          {transaction.asset_name ?? transaction.notes ?? formatDate(transaction.transaction_date)}
        </Text>
      </View>
      <Text weight="800" style={{ color: isPositive ? colors.success : colors.text }}>
        {isPositive ? '+' : '-'}
        {formatCurrency(transaction.amount)}
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
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    gap: 3,
    paddingRight: 12,
  },
});
