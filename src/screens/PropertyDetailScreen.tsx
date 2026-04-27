import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { getPropertyDetail } from '@/services/propertyServices';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatDate, formatPercent } from '@/utils/format';

export function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useWealthTheme();
  const { data } = useAppData();
  const detail = getPropertyDetail(id ?? 'prop-logan', data) ?? getPropertyDetail('prop-logan', data);

  if (!detail) {
    return (
      <Screen>
        <Text variant="title">Property not found</Text>
      </Screen>
    );
  }

  const yearTen = detail.projection[10] ?? detail.projection[detail.projection.length - 1];
  const business = detail.businessProjection;
  const chartPoints = business.points.filter((point) => point.year === 0 || point.year === 10 || point.year % 2 === 0);
  const chartWidth = Math.max(Math.min(Dimensions.get('window').width - 360, 1040), 320);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.breadcrumbs}>
        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Text variant="small" subtle weight="900">
            Home
          </Text>
        </Pressable>
        <Ionicons name="chevron-forward" color={colors.muted} size={13} />
        <Pressable onPress={() => router.replace('/(tabs)/property')}>
          <Text variant="small" subtle weight="900">
            Property
          </Text>
        </Pressable>
        <Ionicons name="chevron-forward" color={colors.muted} size={13} />
        <Text variant="small" weight="900">
          {detail.property.name}
        </Text>
      </View>
      <View style={styles.titleRow}>
        <View style={[styles.iconBox, { backgroundColor: `${colors.chartOne}22` }]}>
          <Ionicons name="home-outline" color={colors.chartOne} size={18} />
        </View>
        <View style={styles.titleCopy}>
        <Text variant="small" subtle weight="800">
          PROPERTY DETAIL
        </Text>
        <Text variant="title">{detail.property.name}</Text>
        <Text subtle>{detail.property.location}</Text>
        </View>
      </View>

      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <Text variant="label" subtle>
          CURRENT VALUE
        </Text>
        <Text variant="title">{formatCurrency(detail.property.current_value)}</Text>
        <MetricRow label="Equity" value={formatCurrency(detail.equity)} tone="positive" />
        <MetricRow label="Debt ratio" value={formatPercent(detail.debtRatio)} tone="warning" />
        <MetricRow label="Gross yield" value={formatPercent(detail.grossYield)} />
        <MetricRow label="Ownership" value={detail.property.ownership_type === 'smsf' ? 'SMSF' : 'Personal'} />
        {detail.property.ownership_type === 'smsf' ? (
          <MetricRow label="Bare trust" value={`${detail.property.name} Custodian Pty Ltd ATF Bare Trust`} />
        ) : null}
      </Panel>

      <SectionHeader title="Value projection" />
      <Panel>
        <MetricRow label="Downside year 10" value={formatCurrency(yearTen.downsideValue)} />
        <MetricRow label="Base year 10" value={formatCurrency(yearTen.baseValue)} tone="positive" />
        <MetricRow label="Upside year 10" value={formatCurrency(yearTen.upsideValue)} tone="positive" />
        <Text subtle>{detail.researchProfile?.local_market_summary}</Text>
      </Panel>

      <SectionHeader title="Property business model" action="Break-even, bills and cash in" />
      <Panel style={[styles.businessPanel, { borderColor: business.breakEvenYear ? colors.success : colors.warning }]}>
        <View style={styles.businessTop}>
          <View style={styles.businessCopy}>
            <Text variant="section">Operating runway</Text>
            <Text subtle>
              Track this property like a business: cumulative bills, cash fed into the asset, equity growth and the year the investment starts carrying its weight.
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="small" subtle weight="800">
              BREAK-EVEN
            </Text>
            <Text variant="section" style={{ color: business.breakEvenYear ? colors.success : colors.warning }}>
              {business.breakEvenYear ? `Year ${business.breakEvenYear}` : '10Y+'}
            </Text>
          </View>
        </View>
        <View style={styles.metricGrid}>
          <InlineMetric label="10Y business return" value={formatCurrency(business.totalReturnTenYear)} color={business.totalReturnTenYear >= 0 ? colors.success : colors.danger} />
          <InlineMetric label="Cash contributed" value={formatCurrency(business.cashContributedTenYear)} color={business.cashContributedTenYear > 0 ? colors.warning : colors.success} />
          <InlineMetric label="Running bills" value={formatCurrency(business.totalBillsTenYear)} color={colors.warning} />
          <InlineMetric label="Year 10 net cashflow" value={formatCurrency(business.yearTen.annualNetCashflow)} color={business.yearTen.annualNetCashflow >= 0 ? colors.success : colors.danger} />
        </View>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: chartPoints.map((point) => `Y${point.year}`),
              datasets: [
                {
                  data: chartPoints.map((point) => Math.round(point.totalBusinessReturn)),
                  color: () => colors.accentStrong,
                  strokeWidth: 3,
                },
                {
                  data: chartPoints.map((point) => Math.round(point.cumulativeCashContributed)),
                  color: () => colors.warning,
                  strokeWidth: 2,
                },
                {
                  data: chartPoints.map((point) => Math.round(point.cumulativeBills)),
                  color: () => colors.chartFive,
                  strokeWidth: 2,
                },
              ],
              legend: ['Return', 'Cash in', 'Bills'],
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
        <MetricRow label="Business verdict" value={business.verdict} tone={business.breakEvenYear ? 'positive' : 'warning'} />
        <View style={styles.signalStack}>
          {business.signals.map((signal) => (
            <View key={signal} style={[styles.signalRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" color={colors.success} size={18} />
              <Text subtle style={styles.signalText}>
                {signal}
              </Text>
            </View>
          ))}
        </View>
      </Panel>

      <SectionHeader title="Bills and evidence" />
      <Panel>
        {detail.bills.bills.map((bill) => (
          <View key={bill.id} style={[styles.billRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: bill.status === 'paid' ? `${colors.success}22` : `${colors.warning}22` }]}>
              <Ionicons name={bill.status === 'paid' ? 'checkmark-circle-outline' : 'alert-circle-outline'} color={bill.status === 'paid' ? colors.success : colors.warning} size={18} />
            </View>
            <View style={styles.billCopy}>
              <Text weight="800">{bill.vendor}</Text>
              <Text variant="small" subtle>
                {bill.bill_type.replace('_', ' ')} due {formatDate(bill.due_date)}
              </Text>
            </View>
            <Text weight="800">{formatCurrency(bill.amount)}</Text>
          </View>
        ))}
      </Panel>

      <SectionHeader title="Operating picture" />
      <Panel>
        <MetricRow label="Annual rent" value={formatCurrency(detail.annualRent)} tone="positive" />
        <MetricRow label="Annual property expenses" value={formatCurrency(detail.property.annual_expenses)} tone="warning" />
        <MetricRow label="Tracked bill average" value={formatCurrency(detail.bills.monthlyAverage)} />
        <MetricRow label="Net operating income" value={formatCurrency(detail.netOperatingIncome)} tone={detail.netOperatingIncome >= 0 ? 'positive' : 'danger'} />
      </Panel>
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
  breadcrumbs: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  titleCopy: { flex: 1, gap: 2 },
  hero: { gap: 12 },
  billRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  billCopy: { flex: 1, gap: 3 },
  iconBox: { alignItems: 'center', borderRadius: 8, height: 34, justifyContent: 'center', width: 34 },
  businessPanel: { gap: 16, overflow: 'hidden' },
  businessTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  businessCopy: { flex: 1, gap: 5 },
  statusBadge: { borderRadius: 8, borderWidth: 1, gap: 3, minWidth: 130, padding: 12 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 160 },
  chartWrap: { alignItems: 'flex-start', marginLeft: -18, overflow: 'hidden' },
  chart: { borderRadius: 8 },
  signalStack: { gap: 0 },
  signalRow: { alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingVertical: 11 },
  signalText: { flex: 1 },
});
