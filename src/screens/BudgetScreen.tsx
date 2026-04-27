import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { Text } from '@/components/Text';
import { getBudgetSummary } from '@/services/calculations';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { BudgetCategory } from '@/types/models';
import { formatCurrency } from '@/utils/format';

const quickExpenses: Array<{ name: string; category_type: BudgetCategory['category_type']; monthly_target: number }> = [
  { name: 'Groceries', category_type: 'discretionary', monthly_target: 1200 },
  { name: 'Fuel', category_type: 'fixed', monthly_target: 380 },
  { name: 'Private health', category_type: 'fixed', monthly_target: 420 },
  { name: 'School fees', category_type: 'fixed', monthly_target: 900 },
  { name: 'Subscriptions', category_type: 'discretionary', monthly_target: 95 },
  { name: 'Eating out', category_type: 'discretionary', monthly_target: 450 },
];

const trendWindows = {
  '3M': ['Feb', 'Mar', 'Apr'],
  '6M': ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  '12M': ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
};
const years = ['2022', '2023', '2024', '2025', '2026'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BudgetScreen() {
  const { colors } = useWealthTheme();
  const budget = getBudgetSummary();
  const chartWidth = Math.min(Dimensions.get('window').width - 32, 430);
  const [categories, setCategories] = useState(budget.categories);
  const [trendWindow, setTrendWindow] = useState<keyof typeof trendWindows>('6M');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('Apr');
  const [newCategory, setNewCategory] = useState<{ name: string; amount: string; type: BudgetCategory['category_type'] }>({ name: '', amount: '', type: 'discretionary' });
  const [transaction, setTransaction] = useState({ description: '', amount: '', date: '2026-04-20', category: 'Groceries' });
  const [pendingTransaction, setPendingTransaction] = useState<typeof transaction | undefined>();
  const [savedTransactions, setSavedTransactions] = useState<Array<typeof transaction & { id: string }>>([]);
  const [imports, setImports] = useState<Array<{ id: string; type: string; status: string }>>([]);
  const trendLabels = trendWindows[trendWindow];
  const trendData = useMemo(() => {
    const base = budget.trend;
    if (trendWindow === '3M') {
      return base.slice(-3);
    }
    if (trendWindow === '12M') {
      return [5900, 6120, 6040, 6250, 6180, 6370, ...base];
    }
    return base;
  }, [budget.trend, trendWindow]);
  const thisMonthSoFar = budget.spendingTotal * 0.68 + savedTransactions.reduce((total, item) => total + Number(item.amount || 0), 0);
  const lastMonthSpend = trendData[Math.max(trendData.length - 2, 0)] ?? budget.spendingTotal;
  const comparison = thisMonthSoFar - lastMonthSpend;

  const addCategory = (name: string, amount: number, type: BudgetCategory['category_type']) => {
    if (!name.trim() || amount <= 0) {
      return;
    }

    setCategories((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        user_id: budget.categories[0]?.user_id ?? 'demo-user',
        name: name.trim(),
        category_type: type,
        monthly_target: amount,
      },
    ]);
    setNewCategory({ name: '', amount: '', type: 'discretionary' });
  };

  return (
    <Screen>
      <View>
        <Text variant="small" subtle weight="800">
          BUDGET
        </Text>
        <Text variant="title">Cashflow pressure</Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="Income" value={formatCurrency(budget.totalIncome)} helper="Monthly target" tone="positive" />
        <StatCard label="Fixed expenses" value={formatCurrency(budget.fixedTotal)} helper="Bills and commitments" tone="warning" />
        <StatCard label="Discretionary" value={formatCurrency(budget.discretionaryTotal)} helper="Lifestyle spend" />
        <StatCard label="Investing" value={formatCurrency(budget.savingTotal)} helper="Monthly allocation" />
        <StatCard label="This month so far" value={formatCurrency(thisMonthSoFar)} helper={`${selectedMonth} ${selectedYear}`} tone="warning" />
        <StatCard label="Vs last month" value={formatCurrency(comparison)} helper={comparison >= 0 ? 'Higher spend' : 'Lower spend'} tone={comparison <= 0 ? 'positive' : 'warning'} />
      </View>

      <SectionHeader title="Spending trend" action="Filter by date" />
      <Panel>
        <Text subtle>Jump back by year and month to compare how your cashflow position has changed over time.</Text>
        <View style={styles.chipRow}>
          {years.map((year) => (
            <Pressable
              key={year}
              onPress={() => setSelectedYear(year)}
              style={[styles.chip, { backgroundColor: selectedYear === year ? colors.accent : colors.surfaceRaised, borderColor: selectedYear === year ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: selectedYear === year ? colors.background : colors.text }}>
                {year}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipRow}>
          {months.map((month) => (
            <Pressable
              key={month}
              onPress={() => setSelectedMonth(month)}
              style={[styles.chip, { backgroundColor: selectedMonth === month ? colors.accent : colors.surfaceRaised, borderColor: selectedMonth === month ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: selectedMonth === month ? colors.background : colors.text }}>
                {month}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipRow}>
          {(Object.keys(trendWindows) as Array<keyof typeof trendWindows>).map((window) => (
            <Pressable
              key={window}
              onPress={() => setTrendWindow(window)}
              style={[styles.chip, { backgroundColor: trendWindow === window ? colors.accent : colors.surfaceRaised, borderColor: trendWindow === window ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: trendWindow === window ? colors.background : colors.text }}>
                {window}
              </Text>
            </Pressable>
          ))}
        </View>
        <LineChart
          data={{
            labels: trendLabels,
            datasets: [{ data: trendData }],
          }}
          width={chartWidth}
          height={210}
          yAxisLabel="$"
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            color: () => colors.accent,
            labelColor: () => colors.textSubtle,
            decimalPlaces: 0,
            propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
            propsForBackgroundLines: { stroke: colors.border },
          }}
          bezier
          style={styles.chart}
        />
      </Panel>

      <SectionHeader title="Editable category table" action="Monthly targets" />
      <Panel style={styles.formPanel}>
        {categories.map((category) => (
          <View key={category.id} style={[styles.editableRow, { borderBottomColor: colors.border }]}>
            <View style={styles.categoryCopy}>
              <Text weight="800">{category.name}</Text>
              <Text variant="small" subtle>
                {category.category_type}
              </Text>
            </View>
            <TextInput
              value={String(category.monthly_target)}
              keyboardType="numeric"
              onChangeText={(value) =>
                setCategories((current) =>
                  current.map((item) => (item.id === category.id ? { ...item, monthly_target: Number(value.replace(/[^0-9.]/g, '')) || 0 } : item)),
                )
              }
              style={[styles.amountInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
          </View>
        ))}
      </Panel>

      <SectionHeader title="Quick add expenses" />
      <Panel style={styles.formPanel}>
        <View style={styles.quickGrid}>
          {quickExpenses.map((item) => (
            <Pressable
              key={item.name}
              onPress={() => addCategory(item.name, item.monthly_target, item.category_type)}
              style={({ pressed }) => [styles.quickButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
            >
              <Text weight="800">{item.name}</Text>
              <Text variant="small" subtle>
                {formatCurrency(item.monthly_target)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputGrid}>
          <TextInput
            placeholder="Custom category"
            placeholderTextColor={colors.muted}
            value={newCategory.name}
            onChangeText={(value) => setNewCategory((current) => ({ ...current, name: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Monthly amount"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={newCategory.amount}
            onChangeText={(value) => setNewCategory((current) => ({ ...current, amount: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
        </View>
        <View style={styles.chipRow}>
          {(['fixed', 'discretionary', 'saving'] as BudgetCategory['category_type'][]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setNewCategory((current) => ({ ...current, type }))}
              style={[styles.chip, { backgroundColor: newCategory.type === type ? colors.accent : colors.surfaceRaised, borderColor: newCategory.type === type ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: newCategory.type === type ? colors.background : colors.text }}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Add category target" onPress={() => addCategory(newCategory.name, Number(newCategory.amount), newCategory.type)} />
      </Panel>

      <SectionHeader title="Wasteful spending insight" />
      <Panel>
        <Text weight="800">Discretionary spend is the main swing factor.</Text>
        <Text subtle>
          A 10% reduction in discretionary spend would release {formatCurrency(budget.discretionaryTotal * 0.1)} per month for ETFs,
          super contributions or SMSF liquidity.
        </Text>
      </Panel>

      <SectionHeader title="Manual transactions" />
      <Panel style={styles.formPanel}>
        <Text subtle>Manual entry prepares a pending update first. Confirm it to add it to the local ledger; later this same flow will save through Supabase.</Text>
        <View style={styles.inputGrid}>
          <TextInput
            placeholder="Description"
            placeholderTextColor={colors.muted}
            value={transaction.description}
            onChangeText={(value) => setTransaction((current) => ({ ...current, description: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Amount"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={transaction.amount}
            onChangeText={(value) => setTransaction((current) => ({ ...current, amount: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Date"
            placeholderTextColor={colors.muted}
            value={transaction.date}
            onChangeText={(value) => setTransaction((current) => ({ ...current, date: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Category"
            placeholderTextColor={colors.muted}
            value={transaction.category}
            onChangeText={(value) => setTransaction((current) => ({ ...current, category: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
        </View>
        <PrimaryButton label="Prepare manual transaction" onPress={() => setPendingTransaction(transaction)} />
        {pendingTransaction ? (
          <View style={[styles.pendingBox, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
            <View style={styles.pendingCopy}>
              <Text weight="900">Pending confirmation</Text>
              <Text variant="small" subtle>
                {pendingTransaction.description || 'Transaction'} - {formatCurrency(Number(pendingTransaction.amount || 0))} - {pendingTransaction.category} - {pendingTransaction.date}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Pressable
                onPress={() => {
                  setSavedTransactions((current) => [{ id: `txn-local-${Date.now()}`, ...pendingTransaction }, ...current]);
                  setPendingTransaction(undefined);
                  setTransaction({ description: '', amount: '', date: '2026-04-20', category: '' });
                }}
                style={[styles.confirmButton, { backgroundColor: colors.success }]}
              >
                <Text weight="900" style={{ color: colors.background }}>
                  Confirm
                </Text>
              </Pressable>
              <Pressable onPress={() => setPendingTransaction(undefined)} style={[styles.confirmButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {savedTransactions.map((item) => (
          <View key={item.id} style={[styles.savedRow, { borderBottomColor: colors.border }]}>
            <Text weight="800">{item.description}</Text>
            <Text subtle>{item.category}</Text>
            <Text weight="800">{formatCurrency(Number(item.amount || 0))}</Text>
          </View>
        ))}
      </Panel>

      <SectionHeader title="Statement uploads" action="Bank and credit card" />
      <Panel style={styles.formPanel}>
        <Text subtle>Upload bank and credit card statements for review before import. The parser is a provider-ready stub for now.</Text>
        <View style={styles.inputGrid}>
          {['Bank statement', 'Credit card statement'].map((type) => (
            <Pressable
              key={type}
              onPress={() => setImports((current) => [{ id: `import-${Date.now()}`, type, status: 'Ready for parser connection' }, ...current])}
              style={({ pressed }) => [styles.uploadCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
            >
              <Text weight="900">{type}</Text>
              <Text variant="small" subtle>
                CSV, OFX or PDF later
              </Text>
            </Pressable>
          ))}
        </View>
        {imports.map((item) => (
          <View key={item.id} style={[styles.savedRow, { borderBottomColor: colors.border }]}>
            <Text weight="800">{item.type}</Text>
            <Text subtle>{item.status}</Text>
          </View>
        ))}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formPanel: {
    gap: 12,
  },
  editableRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  categoryCopy: {
    flex: 1,
    gap: 3,
  },
  amountInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontWeight: '800',
    minHeight: 42,
    paddingHorizontal: 12,
    textAlign: 'right',
    width: 120,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    minWidth: 135,
    padding: 12,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 46,
    minWidth: 180,
    paddingHorizontal: 12,
  },
  pendingBox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  pendingCopy: {
    flex: 1,
    gap: 3,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  savedRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  uploadCard: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minWidth: 220,
    padding: 14,
  },
});
