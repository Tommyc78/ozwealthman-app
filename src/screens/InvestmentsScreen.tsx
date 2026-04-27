import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { calculateBullionLotValue } from '@/services/calculations';
import { getInvestmentProjectionScenario } from '@/services/investmentProjectionService';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { ContributionFrequency } from '@/types/models';
import { formatCurrency } from '@/utils/format';

type DraftInvestment = {
  id: string;
  type: string;
  account: string;
  label: string;
  quantity: string;
  amount: string;
  date: string;
};

export function InvestmentsScreen() {
  const { colors } = useWealthTheme();
  const { data, confirmInvestmentItem, refreshDashboard } = useAppData();
  const [drafts, setDrafts] = useState<DraftInvestment[]>([]);
  const [confirmed, setConfirmed] = useState<DraftInvestment[]>([]);
  const [entry, setEntry] = useState({ type: 'ETF purchase', account: 'Personal', label: 'IVV', quantity: '', amount: '', date: '2026-04-20' });
  const [projectionInputs, setProjectionInputs] = useState({
    extraInvestmentAmount: '1000',
    investmentFrequency: 'monthly' as ContributionFrequency,
    targetAge: '55',
    monthlyIncomeTarget: '7000',
    propertyGrowthRate: '4.5',
    etfGrowthRate: '7',
    cryptoGrowthRate: '8',
    metalsGrowthRate: '4',
    cashReturnRate: '3.5',
    drawdownRate: '4',
  });
  const personalAccountIds = useMemo(() => new Set(data.accounts.filter((account) => !account.is_smsf).map((account) => account.id)), [data.accounts]);
  const personalShares = data.shareHoldings.filter((holding) => personalAccountIds.has(holding.account_id));
  const personalCrypto = data.cryptoHoldings.filter((holding) => personalAccountIds.has(holding.account_id));
  const personalBullion = data.bullionLots.filter((lot) => personalAccountIds.has(lot.account_id)).map(calculateBullionLotValue);
  const personalProperty = data.propertyHoldings.filter((property) => property.ownership_type === 'personal');
  const shareTotal = personalShares.reduce((total, holding) => total + holding.current_value, 0);
  const cryptoTotal = personalCrypto.reduce((total, holding) => total + holding.current_value, 0);
  const bullionTotal = personalBullion.reduce((total, lot) => total + lot.currentEstimatedValue, 0);
  const propertyEquity = personalProperty.reduce((total, property) => total + property.current_value - property.loan_balance, 0);
  const cashTotal = data.accounts.filter((account) => personalAccountIds.has(account.id)).reduce((total, account) => total + (account.current_balance ?? 0), 0);
  const taxableTotal = shareTotal + cryptoTotal + bullionTotal + propertyEquity + cashTotal;
  const projection = useMemo(
    () =>
      getInvestmentProjectionScenario(data, {
        currentAge: data.user.age,
        targetAge: Number(projectionInputs.targetAge) || 55,
        monthlyIncomeTarget: Number(projectionInputs.monthlyIncomeTarget) || 0,
        extraInvestmentAmount: Number(projectionInputs.extraInvestmentAmount) || 0,
        investmentFrequency: projectionInputs.investmentFrequency,
        propertyGrowthRate: (Number(projectionInputs.propertyGrowthRate) || 0) / 100,
        etfGrowthRate: (Number(projectionInputs.etfGrowthRate) || 0) / 100,
        cryptoGrowthRate: (Number(projectionInputs.cryptoGrowthRate) || 0) / 100,
        metalsGrowthRate: (Number(projectionInputs.metalsGrowthRate) || 0) / 100,
        cashReturnRate: (Number(projectionInputs.cashReturnRate) || 0) / 100,
        drawdownRate: (Number(projectionInputs.drawdownRate) || 0) / 100,
      }),
    [data, projectionInputs],
  );
  const projectionChartPoints = projection.points.filter((point, index) => index === 0 || point.age === projection.targetPoint.age || point.age === 67 || point.age % 5 === 0);
  const chartWidth = Math.max(Math.min(Dimensions.get('window').width - 360, 1040), 320);

  const addDraft = () => {
    if (!entry.label.trim()) {
      return;
    }

    setDrafts((current) => [{ id: `investment-draft-${Date.now()}`, ...entry }, ...current]);
    setEntry((current) => ({ ...current, quantity: '', amount: '' }));
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="small" subtle weight="800">
            INVESTMENTS
          </Text>
          <Text variant="title">Personal portfolio</Text>
          <Text subtle>Track taxable assets outside super and SMSF, with the ownership line kept clean.</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Ionicons name="pie-chart-outline" color={colors.accentStrong} size={22} />
        </View>
      </View>

      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <Text variant="label" subtle>
          TAXABLE / PERSONAL ASSETS
        </Text>
        <Text variant="title" style={styles.heroValue}>
          {formatCurrency(taxableTotal)}
        </Text>
        <Text subtle>Separate from super and SMSF. This area is for personal ETFs, crypto, bullion, cash, property and taxable investment records.</Text>
        <View style={styles.heroMetrics}>
          <InlineMetric label="ETFs" value={formatCurrency(shareTotal)} color={colors.chartTwo} />
          <InlineMetric label="Crypto" value={formatCurrency(cryptoTotal)} color={colors.chartFour} />
          <InlineMetric label="Metals" value={formatCurrency(bullionTotal)} color={colors.chartFive} />
          <InlineMetric label="Cash" value={formatCurrency(cashTotal)} color={colors.accentStrong} />
        </View>
        <Pressable onPress={refreshDashboard} style={[styles.refreshButton, { backgroundColor: colors.accent }]}>
          <Ionicons name="refresh-outline" color={colors.background} size={17} />
          <Text weight="900" style={{ color: colors.background }}>
            Refresh dashboard totals
          </Text>
        </Pressable>
      </Panel>

      <SectionHeader title="Investment projections" action="Property, ETFs, crypto, metals, cash" />
      <Panel style={styles.projectionPanel}>
        <View style={styles.projectionTop}>
          <View style={styles.projectionCopy}>
            <Text variant="section">Personal wealth runway</Text>
            <Text subtle>
              Model where the taxable portfolio could land before super access, including personal property, ETFs, crypto, metals, cash and regular new investing.
            </Text>
          </View>
          <View style={[styles.projectionBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="small" subtle weight="800">
              TARGET AGE
            </Text>
            <Text variant="section" style={{ color: colors.accentStrong }}>
              {projection.targetPoint.age}
            </Text>
          </View>
        </View>
        <View style={styles.projectionMetrics}>
          <InlineMetric label="At target age" value={formatCurrency(projection.targetPoint.totalBalance)} color={colors.success} />
          <InlineMetric label="Age 67 scenario" value={formatCurrency(projection.age67Point.totalBalance)} color={colors.accentStrong} />
          <InlineMetric label="Monthly income estimate" value={formatCurrency(projection.projectedMonthlyIncome)} color={projection.monthlyIncomeGap >= 0 ? colors.success : colors.warning} />
        </View>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: projectionChartPoints.map((point) => String(point.age)),
              datasets: [
                {
                  data: projectionChartPoints.map((point) => Math.round(point.totalBalance)),
                  color: () => colors.accentStrong,
                  strokeWidth: 3,
                },
                {
                  data: projectionChartPoints.map((point) => Math.round(point.shares + point.cash)),
                  color: () => colors.chartTwo,
                  strokeWidth: 2,
                },
              ],
              legend: ['Total personal', 'Liquid core'],
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
        <View style={styles.inputGrid}>
          <ProjectionInput label="Extra investment" value={projectionInputs.extraInvestmentAmount} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, extraInvestmentAmount: value }))} />
          <ProjectionInput label="Target age" value={projectionInputs.targetAge} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, targetAge: value }))} />
          <ProjectionInput label="Monthly income target" value={projectionInputs.monthlyIncomeTarget} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, monthlyIncomeTarget: value }))} />
          <ProjectionInput label="Drawdown rate %" value={projectionInputs.drawdownRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, drawdownRate: value }))} />
        </View>
        <View style={styles.chipRow}>
          {(['weekly', 'fortnightly', 'monthly', 'annual'] as ContributionFrequency[]).map((frequency) => (
            <Pressable
              key={frequency}
              onPress={() => setProjectionInputs((current) => ({ ...current, investmentFrequency: frequency }))}
              style={[
                styles.chip,
                {
                  backgroundColor: projectionInputs.investmentFrequency === frequency ? colors.accent : colors.surfaceRaised,
                  borderColor: projectionInputs.investmentFrequency === frequency ? colors.accent : colors.border,
                },
              ]}
            >
              <Text weight="800" style={{ color: projectionInputs.investmentFrequency === frequency ? colors.background : colors.text }}>
                {frequency}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputGrid}>
          <ProjectionInput label="Property growth %" value={projectionInputs.propertyGrowthRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, propertyGrowthRate: value }))} />
          <ProjectionInput label="ETF growth %" value={projectionInputs.etfGrowthRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, etfGrowthRate: value }))} />
          <ProjectionInput label="Crypto growth %" value={projectionInputs.cryptoGrowthRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, cryptoGrowthRate: value }))} />
          <ProjectionInput label="Metals growth %" value={projectionInputs.metalsGrowthRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, metalsGrowthRate: value }))} />
          <ProjectionInput label="Cash return %" value={projectionInputs.cashReturnRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, cashReturnRate: value }))} />
        </View>
      </Panel>

      <SectionHeader title="Investment analyser" action="Strategy signals" />
      <Panel style={[styles.analyserPanel, { borderColor: projection.monthlyIncomeGap >= 0 ? colors.success : colors.warning }]}>
        <View style={styles.projectionMetrics}>
          <InlineMetric label="Annual new investing" value={formatCurrency(projection.annualExtraInvestment)} color={colors.accentStrong} />
          <InlineMetric label="Income gap / surplus" value={formatCurrency(projection.monthlyIncomeGap)} color={projection.monthlyIncomeGap >= 0 ? colors.success : colors.warning} />
          <InlineMetric label="Liquid core at target" value={formatCurrency(projection.targetPoint.shares + projection.targetPoint.cash)} color={colors.chartTwo} />
        </View>
        <View style={styles.strategyGrid}>
          {projection.allocationAtTarget.map((item) => (
            <View key={item.label} style={[styles.strategyTile, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Text variant="small" subtle weight="800">
                {item.label.toUpperCase()}
              </Text>
              <Text weight="800">{formatCurrency(item.value)}</Text>
              <Text variant="small" style={{ color: colors.accentStrong }}>
                {item.percent.toFixed(1)}% of projected portfolio
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.signalStack}>
          {projection.strategySignals.map((signal) => (
            <View key={signal} style={[styles.signalRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" color={colors.success} size={18} />
              <Text subtle style={styles.signalText}>
                {signal}
              </Text>
            </View>
          ))}
        </View>
      </Panel>

      <SectionHeader title="Add investment data" action="Draft before save" />
      <Panel style={styles.formPanel}>
        <Text subtle>Use this as the front door for new taxable holdings. Later this panel will create confirmed Supabase records through the AI/tool flow.</Text>
        <View style={styles.chipRow}>
          {['ETF purchase', 'Crypto purchase', 'Bullion lot', 'Property asset', 'Cash movement', 'Dividend income', 'Other investment'].map((type) => (
            <Pressable
              key={type}
              onPress={() => setEntry((current) => ({ ...current, type }))}
              style={[styles.chip, { backgroundColor: entry.type === type ? colors.accent : colors.surfaceRaised, borderColor: entry.type === type ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: entry.type === type ? colors.background : colors.text }}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputGrid}>
          <TextInput
            placeholder="Symbol, asset or property"
            placeholderTextColor={colors.muted}
            value={entry.label}
            onChangeText={(value) => setEntry((current) => ({ ...current, label: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Units / quantity"
            placeholderTextColor={colors.muted}
            value={entry.quantity}
            onChangeText={(value) => setEntry((current) => ({ ...current, quantity: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Amount"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={entry.amount}
            onChangeText={(value) => setEntry((current) => ({ ...current, amount: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Date"
            placeholderTextColor={colors.muted}
            value={entry.date}
            onChangeText={(value) => setEntry((current) => ({ ...current, date: value }))}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
        </View>
        <View style={styles.chipRow}>
          {['Personal', 'Joint', 'Company', 'Trust'].map((account) => (
            <Pressable
              key={account}
              onPress={() => setEntry((current) => ({ ...current, account }))}
              style={[styles.chip, { backgroundColor: entry.account === account ? colors.accent : colors.surfaceRaised, borderColor: entry.account === account ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: entry.account === account ? colors.background : colors.text }}>
                {account}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Prepare investment update" onPress={addDraft} />
        {drafts.map((draft) => (
          <View key={draft.id} style={[styles.draftRow, { borderBottomColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.accent}22` }]}>
              <Ionicons name="create-outline" color={colors.accentStrong} size={18} />
            </View>
            <View style={styles.draftCopy}>
              <Text weight="800">
                {draft.type}: {draft.label}
              </Text>
              <Text variant="small" subtle>
                {draft.account} - {draft.date} - {draft.quantity || 'no quantity'} - {draft.amount ? formatCurrency(Number(draft.amount)) : 'amount pending'}
              </Text>
            </View>
            <View style={styles.draftActions}>
              <Text variant="small" subtle weight="800">
                Pending
              </Text>
              <Pressable
                onPress={() => {
                  confirmInvestmentItem(draft);
                  setConfirmed((current) => [draft, ...current]);
                  setDrafts((current) => current.filter((item) => item.id !== draft.id));
                }}
                style={[styles.smallAction, { backgroundColor: colors.success }]}
              >
                <Text weight="900" style={{ color: colors.background }}>
                  Confirm
                </Text>
              </Pressable>
              <Pressable onPress={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))} style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {confirmed.map((draft) => (
          <View key={draft.id} style={[styles.draftRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.success}22` }]}>
              <Ionicons name="checkmark-circle-outline" color={colors.success} size={18} />
            </View>
            <View style={styles.draftCopy}>
              <Text weight="800">
                {draft.type}: {draft.label}
              </Text>
              <Text variant="small" subtle>
                Confirmed locally - {draft.account} - {draft.date} - {draft.amount ? formatCurrency(Number(draft.amount)) : 'amount pending'}
              </Text>
            </View>
          </View>
        ))}
      </Panel>

      <SectionHeader title="Personal Investments" />
      <Panel style={styles.holdingsPanel}>
        <HoldingGroup icon="home-outline" title="Property value" value={formatCurrency(propertyEquity)} color={colors.chartOne} />
        {personalProperty.map((property) => (
          <HoldingLine key={property.id} label={property.name} helper="Open Property for full bills, debt and trust details" value={formatCurrency(property.current_value - property.loan_balance)} />
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <HoldingGroup icon="stats-chart-outline" title="ETFs and shares" value={formatCurrency(shareTotal)} color={colors.chartTwo} />
        {personalShares.map((holding) => (
          <HoldingLine key={holding.id} label={`${holding.symbol} - ${holding.name}`} helper={`${holding.quantity} units at ${formatCurrency(holding.current_price)}`} value={formatCurrency(holding.current_value)} />
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <HoldingGroup icon="logo-bitcoin" title="Crypto" value={formatCurrency(cryptoTotal)} color={colors.chartFour} />
        {personalCrypto.map((holding) => (
          <HoldingLine key={holding.id} label={`${holding.symbol} - ${holding.name}`} helper={`${holding.quantity} held`} value={formatCurrency(holding.current_value)} />
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <HoldingGroup icon="podium-outline" title="Personal metals" value={formatCurrency(bullionTotal)} color={colors.chartFive} />
        {personalBullion.map((lot) => (
          <HoldingLine key={lot.id} label={lot.item_name} helper={`${lot.quantity} ${lot.unit_type} at ${lot.storage_location}`} value={formatCurrency(lot.currentEstimatedValue)} />
        ))}
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

function HoldingGroup({ icon, title, value, color }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; color: string }) {
  return (
    <View style={styles.groupHeader}>
      <View style={styles.groupTitle}>
        <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} color={color} size={18} />
        </View>
        <Text variant="section">{title}</Text>
      </View>
      <Text variant="section" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function HoldingLine({ label, helper, value }: { label: string; helper: string; value: string }) {
  const { colors } = useWealthTheme();
  return (
    <View style={[styles.holdingLine, { borderBottomColor: colors.border }]}>
      <View style={styles.draftCopy}>
        <Text weight="800">{label}</Text>
        <Text variant="small" subtle>
          {helper}
        </Text>
      </View>
      <Text weight="800">{value}</Text>
    </View>
  );
}

function ProjectionInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors } = useWealthTheme();
  return (
    <View style={styles.field}>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholderTextColor={colors.muted}
        style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 14, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: 4 },
  headerBadge: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  hero: { gap: 16, padding: 20 },
  heroValue: { fontSize: 34 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 130 },
  formPanel: { gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  textInput: { borderRadius: 8, borderWidth: 1, flexGrow: 1, minHeight: 46, minWidth: 180, paddingHorizontal: 12 },
  draftRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  draftCopy: { flex: 1, gap: 3 },
  iconBox: { alignItems: 'center', borderRadius: 8, height: 34, justifyContent: 'center', width: 34 },
  holdingsPanel: { gap: 12 },
  groupHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  groupTitle: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 },
  holdingLine: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 11 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  draftActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  smallAction: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  refreshButton: { alignItems: 'center', borderRadius: 8, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 42, paddingHorizontal: 12 },
  projectionPanel: { gap: 16, overflow: 'hidden' },
  projectionTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  projectionCopy: { flex: 1, gap: 5 },
  projectionBadge: { borderRadius: 8, borderWidth: 1, gap: 3, minWidth: 130, padding: 12 },
  projectionMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chartWrap: { alignItems: 'flex-start', marginLeft: -18, overflow: 'hidden' },
  chart: { borderRadius: 8 },
  field: { flexGrow: 1, gap: 6, minWidth: 180 },
  analyserPanel: { gap: 16 },
  strategyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  strategyTile: { borderRadius: 8, borderWidth: 1, flexGrow: 1, gap: 4, minWidth: 180, padding: 12 },
  signalStack: { gap: 0 },
  signalRow: { alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingVertical: 11 },
  signalText: { flex: 1 },
});
