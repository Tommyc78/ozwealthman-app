import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { getBullionLots, getSMSFSummary } from '@/services/calculations';
import { getSMSFProjectionScenario } from '@/services/smsfProjectionService';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { ContributionFrequency } from '@/types/models';
import { formatCurrency, formatDate, formatPercent } from '@/utils/format';

type IconName = keyof typeof Ionicons.glyphMap;

export function SMSFPortfolioScreen() {
  const { colors } = useWealthTheme();
  const { data, confirmSMSFLedgerItem, refreshDashboard } = useAppData();
  const [ledgerItems, setLedgerItems] = useState<Array<{ id: string; type: string; label: string; quantity: string; amount: string; date: string }>>([]);
  const [confirmedLedgerItems, setConfirmedLedgerItems] = useState<Array<{ id: string; type: string; label: string; quantity: string; amount: string; date: string }>>([]);
  const [entry, setEntry] = useState({ type: 'ETF units', label: 'VGS', quantity: '', amount: '', date: '2026-04-20' });
  const [projectionInputs, setProjectionInputs] = useState({
    extraContributionAmount: '500',
    contributionFrequency: 'monthly' as ContributionFrequency,
    preservationAge: '60',
    monthlyRetirementBudget: '9000',
    propertyGrowthRate: '4.5',
    etfGrowthRate: '6.5',
    cryptoGrowthRate: '8',
    metalsGrowthRate: '4',
    cashReturnRate: '3.5',
    drawdownRate: '4',
  });
  const smsf = getSMSFSummary(data);
  const smsfAccountIds = new Set(data.accounts.filter((account) => account.is_smsf).map((account) => account.id));
  const bullionLots = getBullionLots(data).filter((lot) => smsfAccountIds.has(lot.account_id));
  const smsfShares = data.shareHoldings.filter((holding) => smsfAccountIds.has(holding.account_id));
  const smsfCrypto = data.cryptoHoldings.filter((holding) => smsfAccountIds.has(holding.account_id));
  const contributions = data.transactions
    .filter((transaction) => transaction.transaction_type === 'contribution' && smsfAccountIds.has(transaction.account_id))
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  const debtRatio = smsf.propertyValue > 0 ? (smsf.loanBalance / smsf.propertyValue) * 100 : 0;
  const metalsGain = bullionLots.reduce((total, lot) => total + lot.unrealizedGainLoss, 0);
  const totalAssetsBeforeDebt = smsf.propertyValue + smsf.cash + smsf.bullion + smsf.shares + smsf.crypto;
  const assetMix = [
    { label: 'Property', value: smsf.propertyEquity, color: colors.chartOne },
    { label: 'ETFs', value: smsf.shares, color: colors.chartTwo },
    { label: 'Metals', value: smsf.bullion, color: colors.chartFive },
    { label: 'Crypto', value: smsf.crypto, color: colors.chartFour },
    { label: 'Cash', value: smsf.cash, color: colors.accentStrong },
  ];
  const assetMixTotal = assetMix.reduce((total, item) => total + item.value, 0);
  const projection = useMemo(
    () =>
      getSMSFProjectionScenario(data, {
        currentAge: data.user.age,
        preservationAge: Number(projectionInputs.preservationAge) || 60,
        extraContributionAmount: Number(projectionInputs.extraContributionAmount) || 0,
        contributionFrequency: projectionInputs.contributionFrequency,
        propertyGrowthRate: (Number(projectionInputs.propertyGrowthRate) || 0) / 100,
        etfGrowthRate: (Number(projectionInputs.etfGrowthRate) || 0) / 100,
        cryptoGrowthRate: (Number(projectionInputs.cryptoGrowthRate) || 0) / 100,
        metalsGrowthRate: (Number(projectionInputs.metalsGrowthRate) || 0) / 100,
        cashReturnRate: (Number(projectionInputs.cashReturnRate) || 0) / 100,
        drawdownRate: (Number(projectionInputs.drawdownRate) || 0) / 100,
        monthlyRetirementBudget: Number(projectionInputs.monthlyRetirementBudget) || 0,
      }),
    [data, projectionInputs],
  );
  const projectionChartPoints = projection.points.filter((point, index) => index === 0 || point.age === projection.preservationPoint.age || point.age === 67 || point.age % 5 === 0);
  const chartWidth = Math.max(Math.min(Dimensions.get('window').width - 360, 1040), 320);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="small" subtle weight="800">
            SMSF COMMAND CENTRE
          </Text>
          <Text variant="title" style={styles.title}>
            Retirement balance sheet
          </Text>
          <Text subtle>Property, debt, liquidity, metals and market assets in one controlled view.</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" color={colors.accentStrong} size={22} />
        </View>
      </View>

      <Panel style={[styles.heroCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <View style={styles.heroBackdrop} pointerEvents="none">
          <View style={[styles.heroGlowPrimary, { backgroundColor: `${colors.accent}14` }]} />
          <View style={[styles.heroGlowSecondary, { backgroundColor: `${colors.chartFive}18` }]} />
          <View style={[styles.heroLine, { backgroundColor: `${colors.chartFive}55` }]} />
        </View>
        <View style={styles.heroTop}>
          <View>
            <Text variant="label" subtle>
              TOTAL SMSF VALUE
            </Text>
            <Text variant="title" style={styles.heroValue}>
              {formatCurrency(smsf.totalBalance)}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.pillDot, { backgroundColor: smsf.monthlyCashflow >= 0 ? colors.success : colors.danger }]} />
            <Text variant="small" weight="800">
              {smsf.monthlyCashflow >= 0 ? 'Cashflow positive' : 'Pressure'}
            </Text>
          </View>
        </View>
        <View style={[styles.assetMixTrack, { backgroundColor: colors.surface }]}>
          {assetMix.map((item) => (
            <View
              key={item.label}
              style={{
                width: `${Math.max(assetMixTotal > 0 ? (item.value / assetMixTotal) * 100 : 0, 4)}%`,
                backgroundColor: item.color,
              }}
            >
              <View style={[styles.segmentHighlight, { backgroundColor: `${colors.chartFive}55` }]} />
            </View>
          ))}
        </View>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Assets before debt" value={formatCurrency(totalAssetsBeforeDebt)} color={colors.accentStrong} />
          <InlineMetric label="Loans" value={formatCurrency(smsf.loanBalance)} color={colors.warning} />
          <InlineMetric label="Liquidity" value={`${smsf.liquidityMonths.toFixed(1)} mo`} color={smsf.liquidityMonths >= 6 ? colors.success : colors.warning} />
        </View>
        <Pressable onPress={refreshDashboard} style={[styles.refreshButton, { backgroundColor: colors.accent }]}>
          <Ionicons name="refresh-outline" color={colors.background} size={17} />
          <Text weight="900" style={{ color: colors.background }}>
            Refresh dashboard totals
          </Text>
        </Pressable>
      </Panel>

      <View style={styles.tileGrid}>
        <CommandTile icon="business-outline" label="Property equity" value={formatCurrency(smsf.propertyEquity)} helper={`${formatPercent(debtRatio)} debt ratio`} color={colors.chartOne} />
        <CommandTile icon="card-outline" label="Loan balances" value={formatCurrency(smsf.loanBalance)} helper="LRBA exposure" color={colors.warning} />
        <CommandTile icon="home-outline" label="Rental inflows" value={formatCurrency(smsf.monthlyRent)} helper="Estimated monthly" color={colors.success} />
        <CommandTile icon="water-outline" label="Cash buffer" value={formatCurrency(smsf.cash)} helper={`${smsf.liquidityMonths.toFixed(1)} months runway`} color={colors.accentStrong} />
      </View>

      <SectionHeader title="SMSF projections" action="Contributions, property, ETFs, metals, crypto" />
      <Panel style={[styles.projectionPanel, { backgroundColor: colors.surfaceRaised }]}>
        <View style={styles.projectionTop}>
          <View style={styles.projectionCopy}>
            <Text variant="section">Preservation-age runway</Text>
            <Text subtle>
              Change the assumptions below to see how extra contributions and asset growth reshape the SMSF before access age. This is deterministic scenario modelling, not personal financial advice.
            </Text>
          </View>
          <View style={[styles.projectionBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="small" subtle weight="800">
              PRESERVATION AGE
            </Text>
            <Text variant="section" style={{ color: colors.accentStrong }}>
              {projection.preservationPoint.age}
            </Text>
          </View>
        </View>
        <View style={styles.projectionMetrics}>
          <InlineMetric label="At preservation age" value={formatCurrency(projection.preservationPoint.totalBalance)} color={colors.success} />
          <InlineMetric label="Age 67 scenario" value={formatCurrency(projection.age67Point.totalBalance)} color={colors.accentStrong} />
          <InlineMetric label="Monthly budget estimate" value={formatCurrency(projection.projectedMonthlyBudget)} color={projection.monthlyBudgetGap >= 0 ? colors.success : colors.warning} />
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
                  data: projectionChartPoints.map((point) => Math.round(point.propertyEquity + point.cash)),
                  color: () => colors.chartTwo,
                  strokeWidth: 2,
                },
              ],
              legend: ['Total SMSF', 'Property equity + cash'],
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
          <ProjectionInput label="Extra contribution" value={projectionInputs.extraContributionAmount} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, extraContributionAmount: value }))} />
          <ProjectionInput label="Preservation age" value={projectionInputs.preservationAge} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, preservationAge: value }))} />
          <ProjectionInput label="Monthly retirement budget" value={projectionInputs.monthlyRetirementBudget} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, monthlyRetirementBudget: value }))} />
          <ProjectionInput label="Drawdown rate %" value={projectionInputs.drawdownRate} onChangeText={(value) => setProjectionInputs((current) => ({ ...current, drawdownRate: value }))} />
        </View>
        <View style={styles.chipRow}>
          {(['weekly', 'fortnightly', 'monthly', 'annual'] as ContributionFrequency[]).map((frequency) => (
            <Pressable
              key={frequency}
              onPress={() => setProjectionInputs((current) => ({ ...current, contributionFrequency: frequency }))}
              style={[
                styles.chip,
                {
                  backgroundColor: projectionInputs.contributionFrequency === frequency ? colors.accent : colors.surfaceRaised,
                  borderColor: projectionInputs.contributionFrequency === frequency ? colors.accent : colors.border,
                },
              ]}
            >
              <Text weight="800" style={{ color: projectionInputs.contributionFrequency === frequency ? colors.background : colors.text }}>
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

      <SectionHeader title="SMSF analyser" action="Access-age strategy output" />
      <Panel style={[styles.analyserPanel, { borderColor: projection.monthlyBudgetGap >= 0 ? colors.success : colors.warning, backgroundColor: colors.surfaceRaised }]}>
        <View style={styles.projectionMetrics}>
          <InlineMetric label="Annual extra contributions" value={formatCurrency(projection.annualExtraContribution)} color={colors.accentStrong} />
          <InlineMetric label="Budget gap / surplus" value={formatCurrency(projection.monthlyBudgetGap)} color={projection.monthlyBudgetGap >= 0 ? colors.success : colors.warning} />
          <InlineMetric label="Cash at access age" value={formatCurrency(projection.preservationPoint.cash)} color={colors.chartTwo} />
        </View>
        <View style={styles.strategyGrid}>
          {projection.allocationAtPreservation.map((item) => (
            <View key={item.label} style={[styles.strategyTile, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Text variant="small" subtle weight="800">
                {item.label.toUpperCase()}
              </Text>
              <Text weight="800">{formatCurrency(item.value)}</Text>
              <Text variant="small" style={{ color: colors.accentStrong }}>
                {item.percent.toFixed(1)}% of projected SMSF
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

      <SectionHeader title="Add SMSF ledger item" action="Units, metals, crypto, cash" />
      <Panel style={styles.formPanel}>
        <Text subtle>Prepared items are not saved yet. Confirm the draft to add it to the local SMSF ledger; production will save the confirmed record to Supabase.</Text>
        <View style={styles.chipRow}>
          {['ETF units', 'Metal lot', 'Crypto units', 'Contribution', 'Cash movement', 'Property expense'].map((type) => (
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
            placeholder="Symbol, asset or vendor"
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
        <PrimaryButton
          label="Prepare SMSF update"
          onPress={() => {
            if (!entry.label.trim()) {
              return;
            }
            setLedgerItems((current) => [{ id: `smsf-entry-${Date.now()}`, ...entry }, ...current]);
            setEntry((current) => ({ ...current, quantity: '', amount: '' }));
          }}
        />
        {ledgerItems.map((item) => (
          <View key={item.id} style={[styles.ledgerRow, { borderBottomColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.accent}22` }]}>
              <Ionicons name="create-outline" color={colors.accentStrong} size={18} />
            </View>
            <View style={styles.contributionCopy}>
              <Text weight="800">
                {item.type}: {item.label}
              </Text>
              <Text variant="small" subtle>
                {item.date} - {item.quantity || 'no units'} - {item.amount ? formatCurrency(Number(item.amount)) : 'amount pending'}
              </Text>
            </View>
            <View style={styles.ledgerActions}>
              <Text variant="small" subtle weight="800">
                Pending
              </Text>
              <Pressable
                onPress={() => {
                  setConfirmedLedgerItems((current) => [item, ...current]);
                  confirmSMSFLedgerItem(item);
                  setLedgerItems((current) => current.filter((draft) => draft.id !== item.id));
                }}
                style={[styles.smallAction, { backgroundColor: colors.success }]}
              >
                <Text weight="900" style={{ color: colors.background }}>
                  Confirm
                </Text>
              </Pressable>
              <Pressable onPress={() => setLedgerItems((current) => current.filter((draft) => draft.id !== item.id))} style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {confirmedLedgerItems.map((item) => (
          <View key={item.id} style={[styles.ledgerRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.success}22` }]}>
              <Ionicons name="checkmark-circle-outline" color={colors.success} size={18} />
            </View>
            <View style={styles.contributionCopy}>
              <Text weight="800">
                {item.type}: {item.label}
              </Text>
              <Text variant="small" subtle>
                Confirmed locally - {item.date} - {item.quantity || 'no units'} - {item.amount ? formatCurrency(Number(item.amount)) : 'amount pending'}
              </Text>
            </View>
          </View>
        ))}
      </Panel>

      <SectionHeader title="Liquidity warnings" />
      <View style={styles.warningGrid}>
        <WarningCard
          icon={smsf.monthlyCashflow >= 0 ? 'checkmark-circle-outline' : 'warning-outline'}
          title="Net SMSF cashflow"
          value={formatCurrency(smsf.monthlyCashflow)}
          helper="Rent less loan repayments and annualized property expenses"
          tone={smsf.monthlyCashflow >= 0 ? 'success' : 'danger'}
        />
        <WarningCard
          icon={smsf.liquidityMonths >= 6 ? 'shield-checkmark-outline' : 'alert-circle-outline'}
          title="Liquidity runway"
          value={`${smsf.liquidityMonths.toFixed(1)} months`}
          helper={smsf.liquidityMonths >= 6 ? 'Buffer is above the six-month guardrail' : 'Buffer is below the preferred guardrail'}
          tone={smsf.liquidityMonths >= 6 ? 'success' : 'warning'}
        />
      </View>

      <SectionHeader title="Properties and debt" />
      <View style={styles.propertyStack}>
        {data.propertyHoldings
          .filter((property) => property.ownership_type === 'smsf')
          .map((property) => {
            const equity = property.current_value - property.loan_balance;
            const propertyDebtRatio = property.current_value > 0 ? (property.loan_balance / property.current_value) * 100 : 0;
            return (
              <Panel key={property.id} style={styles.propertyCard}>
                <View style={styles.propertyHeader}>
                  <View style={styles.propertyTitle}>
                    <View style={[styles.iconBox, { backgroundColor: `${colors.chartOne}22` }]}>
                      <Ionicons name="home-outline" color={colors.chartOne} size={19} />
                    </View>
                    <View>
                      <Text weight="800">{property.name}</Text>
                      <Text variant="small" subtle>
                        {property.location}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.right}>
                    <Text weight="800">{formatCurrency(equity)}</Text>
                    <Text variant="small" subtle>
                      equity
                    </Text>
                  </View>
                </View>
                <View style={[styles.debtTrack, { backgroundColor: colors.surfaceRaised }]}>
                  <View style={[styles.debtFill, { width: `${Math.min(propertyDebtRatio, 100)}%`, backgroundColor: colors.warning }]} />
                </View>
                <MetricRow label="Current value" value={formatCurrency(property.current_value)} />
                <MetricRow label="Loan balance" value={formatCurrency(property.loan_balance)} tone="warning" />
                <MetricRow label="Weekly rent" value={formatCurrency(property.weekly_rent)} tone="positive" />
                <MetricRow label="Annual expenses" value={formatCurrency(property.annual_expenses)} />
              </Panel>
            );
          })}
      </View>

      <SectionHeader title="Market and alternative assets" />
      <Panel style={styles.assetsPanel}>
        <AssetGroup icon="podium-outline" title="Metals" value={formatCurrency(smsf.bullion)} helper={`${formatCurrency(metalsGain)} unrealized gain`} color={colors.chartFive} />
        {bullionLots.map((lot) => (
          <Pressable
            key={lot.id}
            style={[styles.assetRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/assets/bullion/[id]', params: { id: lot.id } })}
          >
            <View>
              <Text weight="800">{lot.item_name}</Text>
              <Text variant="small" subtle>
                {lot.quantity} {lot.unit_type} at {lot.storage_location}
              </Text>
            </View>
            <View style={styles.assetRight}>
              <Text weight="800">{formatCurrency(lot.currentEstimatedValue)}</Text>
              <Text variant="small" style={{ color: lot.unrealizedGainLoss >= 0 ? colors.success : colors.danger }}>
                {formatCurrency(lot.unrealizedGainLoss)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.muted} size={17} />
          </Pressable>
        ))}

        <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />
        <AssetGroup icon="stats-chart-outline" title="ETFs" value={formatCurrency(smsf.shares)} helper="SMSF listed asset sleeve" color={colors.chartTwo} />
        {smsfShares.map((holding) => (
          <AssetLine key={holding.id} label={`${holding.symbol} - ${holding.name}`} helper={`${holding.quantity} units`} value={formatCurrency(holding.current_value)} />
        ))}

        <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />
        <AssetGroup icon="logo-bitcoin" title="Crypto" value={formatCurrency(smsf.crypto)} helper="SMSF digital asset exposure" color={colors.chartFour} />
        {smsfCrypto.map((holding) => (
          <AssetLine key={holding.id} label={`${holding.symbol} - ${holding.name}`} helper={`${holding.quantity} held`} value={formatCurrency(holding.current_value)} />
        ))}
      </Panel>

      <SectionHeader title="Contribution history" action="Manual ledger" />
      <Panel style={styles.contributionPanel}>
        {contributions.map((transaction) => (
          <View key={transaction.id} style={[styles.contributionRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.success}22` }]}>
              <Ionicons name="add-circle-outline" color={colors.success} size={19} />
            </View>
            <View style={styles.contributionCopy}>
              <Text weight="800">{transaction.category}</Text>
              <Text variant="small" subtle>
                {formatDate(transaction.transaction_date)} - {transaction.notes}
              </Text>
            </View>
            <Text weight="800" style={{ color: colors.success }}>
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
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

function CommandTile({ icon, label, value, helper, color }: { icon: IconName; label: string; value: string; helper: string; color: string }) {
  const { colors } = useWealthTheme();
  return (
    <View style={[styles.commandTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} color={color} size={18} />
      </View>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <Text variant="section" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="small" subtle>
        {helper}
      </Text>
    </View>
  );
}

function WarningCard({
  icon,
  title,
  value,
  helper,
  tone,
}: {
  icon: IconName;
  title: string;
  value: string;
  helper: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  const { colors } = useWealthTheme();
  const toneColor = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.danger;

  return (
    <Panel style={[styles.warningCard, { borderColor: toneColor }]}>
      <View style={styles.warningTop}>
        <View style={[styles.iconBox, { backgroundColor: `${toneColor}22` }]}>
          <Ionicons name={icon} color={toneColor} size={19} />
        </View>
        <Text variant="small" subtle weight="800">
          LIQUIDITY SIGNAL
        </Text>
      </View>
      <Text weight="800">{title}</Text>
      <Text variant="section" style={{ color: toneColor }}>
        {value}
      </Text>
      <Text variant="small" subtle>
        {helper}
      </Text>
    </Panel>
  );
}

function AssetGroup({ icon, title, value, helper, color }: { icon: IconName; title: string; value: string; helper: string; color: string }) {
  return (
    <View style={styles.assetGroup}>
      <View style={styles.propertyTitle}>
        <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} color={color} size={19} />
        </View>
        <View>
          <Text variant="section">{title}</Text>
          <Text variant="small" subtle>
            {helper}
          </Text>
        </View>
      </View>
      <Text variant="section" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function AssetLine({ label, helper, value }: { label: string; helper: string; value: string }) {
  const { colors } = useWealthTheme();
  return (
    <View style={[styles.assetRow, { borderBottomColor: colors.border }]}>
      <View style={styles.assetCopy}>
        <Text weight="800" numberOfLines={1}>
          {label}
        </Text>
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
  screen: {
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    marginTop: 2,
  },
  headerBadge: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  heroCard: {
    gap: 18,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlowPrimary: {
    height: 170,
    position: 'absolute',
    right: -40,
    top: -24,
    transform: [{ rotate: '8deg' }],
    width: 280,
  },
  heroGlowSecondary: {
    bottom: -24,
    height: 110,
    left: -30,
    position: 'absolute',
    transform: [{ rotate: '-7deg' }],
    width: 240,
  },
  heroLine: {
    height: 2,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 0,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroValue: {
    fontSize: 36,
    marginTop: 6,
  },
  pill: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  assetMixTrack: {
    borderRadius: 8,
    flexDirection: 'row',
    height: 14,
    overflow: 'hidden',
  },
  segmentHighlight: {
    height: 3,
    marginLeft: '10%',
    marginTop: 1,
    width: '70%',
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineMetric: {
    flex: 1,
    gap: 4,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  commandTile: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 8,
    minHeight: 138,
    minWidth: 156,
    padding: 15,
    width: '47%',
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  warningGrid: {
    gap: 12,
  },
  warningCard: {
    gap: 8,
  },
  warningTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  propertyStack: {
    gap: 12,
  },
  propertyCard: {
    gap: 12,
  },
  propertyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  propertyTitle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  right: {
    alignItems: 'flex-end',
  },
  debtTrack: {
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
  },
  debtFill: {
    height: 8,
  },
  assetsPanel: {
    gap: 12,
  },
  assetGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  assetCopy: {
    flex: 1,
    gap: 3,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  groupDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  contributionPanel: {
    paddingVertical: 8,
  },
  contributionRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  contributionCopy: {
    flex: 1,
    gap: 3,
  },
  formPanel: {
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
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
  ledgerRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  ledgerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  smallAction: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  refreshButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  projectionPanel: {
    gap: 16,
    overflow: 'hidden',
  },
  projectionTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  projectionCopy: {
    flex: 1,
    gap: 5,
  },
  projectionBadge: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    minWidth: 142,
    padding: 12,
  },
  projectionMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartWrap: {
    alignItems: 'flex-start',
    marginLeft: -18,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 8,
  },
  field: {
    flexGrow: 1,
    gap: 6,
    minWidth: 180,
  },
  analyserPanel: {
    gap: 16,
  },
  strategyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  strategyTile: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minWidth: 180,
    padding: 12,
  },
  signalStack: {
    gap: 0,
  },
  signalRow: {
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 11,
  },
  signalText: {
    flex: 1,
  },
});
