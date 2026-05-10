import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { getPropertyBillSummary, getPropertyDetail, getPropertyPortfolioLoanSnapshot } from '@/services/propertyServices';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { PropertyBill, PropertyBillType } from '@/types/models';
import { formatCurrency } from '@/utils/format';

export function PropertyCommandScreen() {
  const { colors } = useWealthTheme();
  const { data, addPropertyBill, togglePropertyBillPaid } = useAppData();
  const [billPeriod, setBillPeriod] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4' | 'half1' | 'half2'>('all');
  const [billForm, setBillForm] = useState<{
    property_id: string;
    vendor: string;
    bill_type: PropertyBillType;
    amount: string;
    due_date: string;
    recurrence: PropertyBill['recurrence'];
  }>({
    property_id: data.propertyHoldings[0]?.id ?? '',
    vendor: '',
    bill_type: 'water',
    amount: '',
    due_date: '2026-06-30',
    recurrence: 'quarterly',
  });

  const portfolio = useMemo(() => {
    let totalValue = 0;
    let totalDebt = 0;
    let totalEquity = 0;
    let totalRepayments = 0;
    let weightedRate = 0;

    data.propertyHoldings.forEach((property) => {
      totalValue += property.current_value;
      totalDebt += property.loan_balance;
      totalEquity += property.current_value - property.loan_balance;
      totalRepayments += property.monthly_repayment;
      weightedRate += property.interest_rate * property.loan_balance;
    });

    const avgRate = totalDebt > 0 ? weightedRate / totalDebt : 0;
    const lvr = totalValue > 0 ? (totalDebt / totalValue) * 100 : 0;

    return { totalValue, totalDebt, totalEquity, totalRepayments, avgRate, lvr };
  }, [data.propertyHoldings]);

  const allBills = getPropertyBillSummary(undefined, data);
  const loanSnapshot = useMemo(() => getPropertyPortfolioLoanSnapshot(data), [data]);
  const chartWidth = Math.max(Math.min(Dimensions.get('window').width - 96, 1040), 300);
  const debtMixMax = Math.max(...data.propertyHoldings.map((property) => property.current_value), 1);
  const payoffLabels = loanSnapshot.balanceSchedule.points.map((point) => String(point.year));
  const payoffBalances = loanSnapshot.balanceSchedule.points.map((point) => point.balance);
  const interestPrincipalLabels = loanSnapshot.interestPrincipalSchedule.slice(0, 6).map((point) => `Y${point.year}`);
  const interestSeries = loanSnapshot.interestPrincipalSchedule.slice(0, 6).map((point) => point.interestPaid);
  const principalSeries = loanSnapshot.interestPrincipalSchedule.slice(0, 6).map((point) => point.principalPaid);

  const visibleBills = useMemo(() => {
    const monthRanges: Record<typeof billPeriod, number[]> = {
      all: [],
      q1: [1, 2, 3],
      q2: [4, 5, 6],
      q3: [7, 8, 9],
      q4: [10, 11, 12],
      half1: [1, 2, 3, 4, 5, 6],
      half2: [7, 8, 9, 10, 11, 12],
    };

    if (billPeriod === 'all') {
      return allBills.bills;
    }

    return allBills.bills.filter((bill) => monthRanges[billPeriod].includes(Number(bill.due_date.slice(5, 7))));
  }, [allBills.bills, billPeriod]);

  const submitPropertyBill = () => {
    const amount = Number(billForm.amount);
    if (!billForm.vendor.trim() || amount <= 0) {
      return;
    }

    addPropertyBill({
      property_id: billForm.property_id,
      bill_type: billForm.bill_type,
      vendor: billForm.vendor.trim(),
      amount,
      due_date: billForm.due_date,
      paid_date: undefined,
      status: 'upcoming',
      recurrence: billForm.recurrence,
      notes: 'Added from property command centre',
    });

    setBillForm((current) => ({ ...current, vendor: '', amount: '' }));
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="small" subtle weight="800">
            PROPERTY COMMAND CENTRE
          </Text>
          <Text variant="title">Property dashboard</Text>
          <Text subtle>Track current properties, ownership, bare trust details, debt, rent and bills.</Text>
        </View>
        <Pressable
          style={[styles.headerButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
          onPress={() => router.push('/tax')}
        >
          <Ionicons name="calendar-outline" color={colors.accentStrong} size={22} />
        </Pressable>
      </View>

      <Panel style={[styles.hero, { borderColor: colors.accent }]}>
        <Text variant="label" subtle>
          PORTFOLIO OVERVIEW
        </Text>
        <Text variant="title" style={styles.heroValue}>
          {formatCurrency(portfolio.totalValue)}
        </Text>
        <Text subtle>Total portfolio value across {data.propertyHoldings.length} properties</Text>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Equity" value={formatCurrency(portfolio.totalEquity)} color={colors.success} />
          <InlineMetric label="Debt" value={formatCurrency(portfolio.totalDebt)} color={colors.danger} />
          <InlineMetric label="LVR" value={`${portfolio.lvr.toFixed(1)}%`} color={portfolio.lvr > 80 ? colors.danger : colors.warning} />
          <InlineMetric label="Avg Rate" value={`${portfolio.avgRate.toFixed(2)}%`} color={colors.accentStrong} />
          <InlineMetric label="Repayments / month" value={formatCurrency(portfolio.totalRepayments)} color={colors.text} />
        </View>
      </Panel>

      <SectionHeader title="Debt vs equity" action="Portfolio mix by property" />
      <Panel style={styles.formPanel}>
        <Text subtle>See how much of each property is owned versus still funded by debt. This gives a fast read on concentration and leverage.</Text>
        <View style={styles.debtMixStack}>
          {data.propertyHoldings.map((property) => {
            const equity = Math.max(property.current_value - property.loan_balance, 0);
            const debtFlex = Math.max((property.loan_balance / debtMixMax) * 100, 8);
            const equityFlex = Math.max((equity / debtMixMax) * 100, 8);

            return (
              <View key={property.id} style={styles.debtMixRow}>
                <View style={styles.debtMixHeader}>
                  <Text weight="800">{property.name}</Text>
                  <Text variant="small" subtle>
                    {property.ownership_type === 'smsf' ? 'SMSF' : 'Personal'}
                  </Text>
                </View>
                <View style={[styles.debtMixTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.debtMixFill, { flex: debtFlex, backgroundColor: colors.danger }]} />
                  <View style={[styles.debtMixFill, { flex: equityFlex, backgroundColor: colors.success }]} />
                </View>
                <View style={styles.debtMixFooter}>
                  <Text variant="small" subtle>
                    Debt {formatCurrency(property.loan_balance)}
                  </Text>
                  <Text variant="small" subtle>
                    Equity {formatCurrency(equity)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Panel>

      <SectionHeader title="Payoff graph" action={`${loanSnapshot.weightedAverageRate.toFixed(2)}% weighted rate`} />
      <Panel style={styles.formPanel}>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Debt today" value={formatCurrency(portfolio.totalDebt)} color={colors.danger} />
          <InlineMetric label="Principal year 1" value={formatCurrency(loanSnapshot.totalAnnualPrincipalYearOne)} color={colors.success} />
          <InlineMetric label="Interest year 1" value={formatCurrency(loanSnapshot.totalAnnualInterestYearOne)} color={colors.warning} />
          <InlineMetric
            label="Payoff term"
            value={loanSnapshot.balanceSchedule.totalMonths >= 999 ? 'Review repayment' : `${Math.ceil(loanSnapshot.balanceSchedule.totalMonths / 12)} yrs`}
            color={colors.text}
          />
        </View>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: payoffLabels,
              datasets: [{ data: payoffBalances, color: () => colors.accentStrong, strokeWidth: 3 }],
              legend: ['Portfolio debt balance'],
            }}
            width={chartWidth}
            height={240}
            yAxisLabel="$"
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: () => colors.textSubtle,
              decimalPlaces: 0,
              labelColor: () => colors.textSubtle,
              propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '6 8' },
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.surface },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </Panel>

      <SectionHeader title="Interest vs principal" action="First six years at current repayment" />
      <Panel style={styles.formPanel}>
        <Text subtle>
          This is the part people usually miss. Early on, interest does most of the work. As the loan seasons, principal starts taking over.
        </Text>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: interestPrincipalLabels.length > 0 ? interestPrincipalLabels : ['Y1'],
              datasets: [
                { data: interestSeries.length > 0 ? interestSeries : [0], color: () => colors.warning, strokeWidth: 3 },
                { data: principalSeries.length > 0 ? principalSeries : [0], color: () => colors.success, strokeWidth: 3 },
              ],
              legend: ['Interest paid', 'Principal paid'],
            }}
            width={chartWidth}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: () => colors.textSubtle,
              decimalPlaces: 0,
              labelColor: () => colors.textSubtle,
              propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '6 8' },
              propsForDots: { r: '3', strokeWidth: '2', stroke: colors.surface },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </Panel>

      <SectionHeader title="Current properties" action="Tap to drill down" />
      <View style={styles.stack}>
        {data.propertyHoldings.map((property) => {
          const detail = getPropertyDetail(property.id, data);
          const isSMSF = property.ownership_type === 'smsf';

          return (
            <Pressable
              key={property.id}
              style={[styles.propertyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/property/[id]', params: { id: property.id } })}
            >
              <View style={styles.propertyTop}>
                <View style={[styles.iconBox, { backgroundColor: `${colors.chartOne}22` }]}>
                  <Ionicons name="home-outline" color={colors.chartOne} size={19} />
                </View>
                <View style={styles.propertyCopy}>
                  <Text weight="800">{property.name}</Text>
                  <Text variant="small" subtle>
                    {property.location}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ownershipPill,
                    {
                      backgroundColor: isSMSF ? `${colors.chartTwo}22` : `${colors.success}22`,
                      borderColor: isSMSF ? colors.chartTwo : colors.success,
                    },
                  ]}
                >
                  <Text variant="small" weight="900" style={{ color: isSMSF ? colors.chartTwo : colors.success }}>
                    {isSMSF ? 'SMSF' : 'Personal'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" color={colors.muted} size={18} />
              </View>

              <View style={styles.propertyMetrics}>
                <InlineMetric label="Value" value={formatCurrency(property.current_value)} color={colors.text} />
                <InlineMetric label="Equity" value={formatCurrency(detail?.equity ?? 0)} color={colors.success} />
                <InlineMetric label="Rent" value={formatCurrency(property.weekly_rent)} color={colors.accentStrong} />
              </View>

              <View style={styles.propertyMetrics}>
                <InlineMetric label="Rate" value={`${property.interest_rate.toFixed(2)}%`} color={colors.warning} />
                <InlineMetric label="Repayment / month" value={formatCurrency(property.monthly_repayment)} color={colors.text} />
                <InlineMetric
                  label="LVR"
                  value={`${(detail?.debtRatio ?? 0).toFixed(1)}%`}
                  color={(detail?.debtRatio ?? 0) > 80 ? colors.danger : colors.warning}
                />
              </View>

              {isSMSF ? (
                <View style={[styles.trustRow, { borderTopColor: colors.border }]}>
                  <Text variant="small" subtle weight="800">
                    BARE TRUST
                  </Text>
                  <Text weight="800">{property.bare_trust_name ?? `${property.name} Custodian Pty Ltd ATF Bare Trust`}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Bills tracker" action="Quarter, half and paid status" />
      <Panel style={styles.formPanel}>
        <MetricRow label="Annualized property bills" value={formatCurrency(allBills.annualized)} />
        <MetricRow label="Monthly average" value={formatCurrency(allBills.monthlyAverage)} />
        <MetricRow label="Upcoming bills" value={formatCurrency(allBills.upcomingTotal)} tone="warning" />

        <View style={styles.chipRow}>
          {(['all', 'q1', 'q2', 'q3', 'q4', 'half1', 'half2'] as const).map((period) => (
            <Pressable
              key={period}
              onPress={() => setBillPeriod(period)}
              style={[
                styles.chip,
                {
                  backgroundColor: billPeriod === period ? colors.accent : colors.surfaceRaised,
                  borderColor: billPeriod === period ? colors.accent : colors.border,
                },
              ]}
            >
              <Text weight="800" style={{ color: billPeriod === period ? colors.background : colors.text }}>
                {period.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {visibleBills.map((bill) => (
          <View key={bill.id} style={[styles.billRow, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => togglePropertyBillPaid(bill.id)}
              style={[
                styles.checkbox,
                {
                  backgroundColor: bill.status === 'paid' ? colors.success : colors.surfaceRaised,
                  borderColor: bill.status === 'paid' ? colors.success : colors.border,
                },
              ]}
            >
              {bill.status === 'paid' ? <Ionicons name="checkmark" color={colors.background} size={15} /> : null}
            </Pressable>
            <View style={styles.billCopy}>
              <Text weight="800">{bill.vendor}</Text>
              <Text variant="small" subtle>
                {bill.bill_type.replace('_', ' ')} - due {bill.due_date} -{' '}
                {data.propertyHoldings.find((property) => property.id === bill.property_id)?.name ?? 'Property'}
              </Text>
            </View>
            <Text weight="800" style={{ color: bill.status === 'paid' ? colors.success : colors.warning }}>
              {formatCurrency(bill.amount)}
            </Text>
          </View>
        ))}

        <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />
        <Text weight="800">Add property bill</Text>
        <View style={styles.inputGrid}>
          <TextInput
            placeholder="Vendor, e.g. Chevron Water"
            placeholderTextColor={colors.muted}
            value={billForm.vendor}
            onChangeText={(value) => setBillForm((current) => ({ ...current, vendor: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Amount"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={billForm.amount}
            onChangeText={(value) => setBillForm((current) => ({ ...current, amount: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Due date"
            placeholderTextColor={colors.muted}
            value={billForm.due_date}
            onChangeText={(value) => setBillForm((current) => ({ ...current, due_date: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
        </View>
        <View style={styles.chipRow}>
          {data.propertyHoldings.map((property) => (
            <Pressable
              key={property.id}
              onPress={() => setBillForm((current) => ({ ...current, property_id: property.id }))}
              style={[
                styles.chip,
                {
                  backgroundColor: billForm.property_id === property.id ? colors.accent : colors.surfaceRaised,
                  borderColor: billForm.property_id === property.id ? colors.accent : colors.border,
                },
              ]}
            >
              <Text weight="800" style={{ color: billForm.property_id === property.id ? colors.background : colors.text }}>
                {property.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipRow}>
          {(['water', 'rates', 'body_corporate', 'insurance', 'repairs', 'loan', 'other'] as PropertyBillType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setBillForm((current) => ({ ...current, bill_type: type }))}
              style={[
                styles.chip,
                {
                  backgroundColor: billForm.bill_type === type ? colors.accent : colors.surfaceRaised,
                  borderColor: billForm.bill_type === type ? colors.accent : colors.border,
                },
              ]}
            >
              <Text weight="800" style={{ color: billForm.bill_type === type ? colors.background : colors.text }}>
                {type.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Add bill to tracker" onPress={submitPropertyBill} />
      </Panel>

      <PrimaryButton label="Open tax and SMSF checklist" onPress={() => router.push('/tax')} />
    </Screen>
  );
}

function InlineMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.inlineMetric}>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <Text variant="section" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 14, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: 4 },
  headerButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  hero: { gap: 16, padding: 20 },
  heroValue: { fontSize: 28 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 120 },
  stack: { gap: 12 },
  propertyCard: { borderRadius: 8, borderWidth: 1, gap: 14, padding: 15 },
  propertyTop: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  propertyCopy: { flex: 1, gap: 3 },
  propertyMetrics: { flexDirection: 'row', gap: 12 },
  ownershipPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  trustRow: { borderTopWidth: StyleSheet.hairlineWidth, gap: 4, paddingTop: 12 },
  iconBox: { alignItems: 'center', borderRadius: 8, height: 34, justifyContent: 'center', width: 34 },
  formPanel: { gap: 12 },
  debtMixStack: { gap: 12 },
  debtMixRow: { gap: 6 },
  debtMixHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  debtMixTrack: { borderRadius: 6, flexDirection: 'row', height: 12, overflow: 'hidden' },
  debtMixFill: { height: '100%' },
  debtMixFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  chartWrap: { alignItems: 'flex-start', marginLeft: -16, overflow: 'hidden' },
  chart: { borderRadius: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  billRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  checkbox: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 24, justifyContent: 'center', width: 24 },
  billCopy: { flex: 1, gap: 3 },
  groupDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  textInput: { borderRadius: 8, borderWidth: 1, flexGrow: 1, minHeight: 46, minWidth: 190, paddingHorizontal: 12 },
});
