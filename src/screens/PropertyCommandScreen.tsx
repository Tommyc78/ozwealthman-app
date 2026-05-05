import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { getPropertyDetail } from '@/services/propertyServices';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

export function PropertyCommandScreen() {
  const { colors } = useWealthTheme();
  const { data } = useAppData();

  const portfolio = useMemo(() => {
    let totalValue = 0;
    let totalDebt = 0;
    let totalEquity = 0;
    let totalRepayments = 0;
    let weightedRate = 0;

    data.propertyHoldings.forEach((p) => {
      totalValue += p.current_value;
      totalDebt += p.loan_balance;
      totalEquity += p.current_value - p.loan_balance;
      totalRepayments += p.monthly_repayment;
      weightedRate += p.interest_rate * p.loan_balance;
    });

    const avgRate = totalDebt > 0 ? weightedRate / totalDebt : 0;
    const lvr = totalValue > 0 ? (totalDebt / totalValue) * 100 : 0;

    return { totalValue, totalDebt, totalEquity, totalRepayments, avgRate, lvr };
  }, [data.propertyHoldings]);

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
          <InlineMetric label="Repayments" value={formatCurrency(portfolio.totalRepayments)} color={colors.text} />
        </View>
      </Panel>

      <SectionHeader title="Debt to equity position" action="Per property breakdown" />

      <Panel>
        <View style={styles.eqLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text variant="small" subtle>Equity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text variant="small" subtle>Debt</Text>
          </View>
        </View>

        {data.propertyHoldings.map((property) => {
          const equity = property.current_value - property.loan_balance;
          const eqPct = property.current_value > 0 ? (equity / property.current_value) * 100 : 0;
          const debtPct = 100 - eqPct;

          return (
            <View key={property.id} style={styles.eqBarRow}>
              <View style={styles.eqBarLabel}>
                <Text weight="800" numberOfLines={1}>{property.name}</Text>
                <Text variant="small" subtle>{formatCurrency(property.current_value)}</Text>
              </View>
              <View style={styles.eqBarTrack}>
                <View style={[styles.eqBarFill, { width: `${eqPct}%`, backgroundColor: colors.success }]}>
                  {eqPct > 15 ? (
                    <Text variant="small" weight="900" style={{ color: colors.background, paddingHorizontal: 6 }}>
                      {eqPct.toFixed(0)}%
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.eqBarFill, { width: `${debtPct}%`, backgroundColor: colors.danger }]}>
                  {debtPct > 15 ? (
                    <Text variant="small" weight="900" style={{ color: colors.background, paddingHorizontal: 6 }}>
                      {debtPct.toFixed(0)}%
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.eqBarValues}>
                <Text variant="small" style={{ color: colors.success }}>{formatCurrency(equity)}</Text>
                <Text variant="small" style={{ color: colors.danger }}>{formatCurrency(property.loan_balance)}</Text>
              </View>
            </View>
          );
        })}

        <View style={[styles.eqBarRow, { marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <View style={styles.eqBarLabel}>
            <Text weight="900">Total portfolio</Text>
          </View>
          <View style={styles.eqBarTrack}>
            <View
              style={[
                styles.eqBarFill,
                {
                  width: `${portfolio.totalValue > 0 ? (portfolio.totalEquity / portfolio.totalValue) * 100 : 0}%`,
                  backgroundColor: colors.success,
                },
              ]}
            />
            <View
              style={[
                styles.eqBarFill,
                {
                  width: `${portfolio.totalValue > 0 ? (portfolio.totalDebt / portfolio.totalValue) * 100 : 0}%`,
                  backgroundColor: colors.danger,
                },
              ]}
            />
          </View>
          <View style={styles.eqBarValues}>
            <Text variant="small" weight="800" style={{ color: colors.success }}>{formatCurrency(portfolio.totalEquity)}</Text>
            <Text variant="small" weight="800" style={{ color: colors.danger }}>{formatCurrency(portfolio.totalDebt)}</Text>
          </View>
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
                <InlineMetric label="Interest Rate" value={`${property.interest_rate}%`} color={colors.warning} />
                <InlineMetric label="Repayment" value={formatCurrency(property.monthly_repayment)} color={colors.text} />
                <InlineMetric label="LVR" value={`${(detail?.debtRatio ?? 0).toFixed(1)}%`} color={(detail?.debtRatio ?? 0) > 80 ? colors.danger : colors.warning} />
              </View>

              {isSMSF ? (
                <View style={[styles.trustRow, { borderTopColor: colors.border }]}>
                  <Text variant="small" subtle weight="800">
                    BARE TRUST
                  </Text>
                  <Text weight="800">{property.name} Custodian Pty Ltd ATF Bare Trust</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

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
  eqLegend: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  eqBarRow: { gap: 6, paddingVertical: 10 },
  eqBarLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eqBarTrack: { flexDirection: 'row', height: 22, borderRadius: 6, overflow: 'hidden' },
  eqBarFill: { height: '100%', justifyContent: 'center' },
  eqBarValues: { flexDirection: 'row', justifyContent: 'space-between' },
  stack: { gap: 12 },
  propertyCard: { borderRadius: 8, borderWidth: 1, gap: 14, padding: 15 },
  propertyTop: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  propertyCopy: { flex: 1, gap: 3 },
  propertyMetrics: { flexDirection: 'row', gap: 12 },
  ownershipPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  trustRow: { borderTopWidth: StyleSheet.hairlineWidth, gap: 4, paddingTop: 12 },
  iconBox: { alignItems: 'center', borderRadius: 8, height: 34, justifyContent: 'center', width: 34 },
});
