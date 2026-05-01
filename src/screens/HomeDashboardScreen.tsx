import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { TransactionRow } from '@/components/TransactionRow';
import { useAppData } from '@/data/AppDataProvider';
import { AllocationItem } from '@/services/calculations';
import { getDashboardSummary } from '@/services/calculations';
import { useIsDesktopWeb } from '@/platform/useIsDesktopWeb';
import { WealthColors } from '@/theme/tokens';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatPercent } from '@/utils/format';

export function HomeDashboardScreen() {
  const { colors } = useWealthTheme();
  const { data, lastRefreshedAt, refreshDashboard } = useAppData();
  const isDesktopWeb = useIsDesktopWeb();
  const dashboard = getDashboardSummary(data);
  const positiveSurplus = dashboard.monthlySurplus >= 0;

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.brandRow}>
            <View style={[styles.brandRule, { backgroundColor: colors.chartFive }]} />
            <Text variant="small" subtle weight="800">
              OZWEALTHMAN
            </Text>
          </View>
          <Text variant="title" style={styles.title}>
            Command centre
          </Text>
          <Text subtle>Your full wealth position, in one disciplined view.</Text>
        </View>
        <Pressable style={[styles.askButton, { backgroundColor: `${colors.accent}20`, borderColor: colors.accent }]} onPress={() => router.push('/(tabs)/ai')}>
          <Ionicons name="chatbubble-ellipses-outline" color={colors.accentStrong} size={22} />
        </Pressable>
      </View>

      <Panel style={[styles.heroCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <View style={styles.heroBackdrop} pointerEvents="none">
          <View style={[styles.heroGlowPrimary, { backgroundColor: `${colors.accent}16` }]} />
          <View style={[styles.heroGlowSecondary, { backgroundColor: `${colors.chartFive}18` }]} />
          <View style={[styles.heroLine, { backgroundColor: `${colors.chartFive}55` }]} />
        </View>
        <View style={styles.heroTopRow}>
          <View>
            <Text variant="label" subtle>
              TOTAL NET WORTH
            </Text>
            <Text variant="title" style={styles.heroValue}>
              {formatCurrency(dashboard.netWorth)}
            </Text>
          </View>
          <View style={[styles.statusPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text variant="small" weight="800">
              Refreshed {lastRefreshedAt.slice(11, 16)}
            </Text>
          </View>
        </View>
        <Text subtle style={styles.heroSummary}>
          {dashboard.aiSummary}
        </Text>
        <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
        <View style={styles.heroBottomRow}>
          <InlineMetric label="Monthly surplus" value={formatCurrency(dashboard.monthlySurplus)} color={positiveSurplus ? colors.success : colors.danger} />
          <InlineMetric label="Passive income" value={formatCurrency(dashboard.passiveIncomeMonthly)} color={colors.accentStrong} />
        </View>
      </Panel>

      <Panel style={[styles.startPanel, isDesktopWeb && styles.startPanelDesktop]}>
        <View style={styles.startCopy}>
          <Text variant="label" subtle>
            START HERE
          </Text>
          <Text variant="section">Build a dashboard from scratch or add the next record.</Text>
          <Text subtle>OzWealthman should grow from real user inputs: profile, accounts, investments, properties, super, bills and SMSF records.</Text>
        </View>
        <View style={styles.startActions}>
          <StartAction icon="add-circle-outline" label="Start setup" onPress={() => router.push('/onboarding')} />
          <StartAction icon="pie-chart-outline" label="Add investment" onPress={() => router.push('/(tabs)/investments')} />
          <StartAction icon="home-outline" label="Add property bill" onPress={() => router.push('/(tabs)/property')} />
          <StartAction icon="refresh-outline" label="Refresh dashboard" onPress={refreshDashboard} />
          <StartAction icon="chatbubble-ellipses-outline" label="Ask OzWealthman" onPress={() => router.push('/(tabs)/ai')} />
        </View>
      </Panel>

      <View style={[styles.metricGrid, isDesktopWeb && styles.metricGridDesktop]}>
        <DashboardTile
          icon="trending-up-outline"
          label="Monthly surplus"
          value={formatCurrency(dashboard.monthlySurplus)}
          helper="Available before extra investing"
          color={positiveSurplus ? colors.success : colors.danger}
          desktop={isDesktopWeb}
        />
        <DashboardTile
          icon="shield-checkmark-outline"
          label="Super + SMSF"
          value={formatCurrency(dashboard.superTotal + dashboard.smsfTotal)}
          helper="Retirement assets"
          color={colors.chartTwo}
          onPress={() => router.push('/(tabs)/smsf')}
          desktop={isDesktopWeb}
        />
        <DashboardTile
          icon="business-outline"
          label="SMSF balance"
          value={formatCurrency(dashboard.smsfTotal)}
          helper="Property, cash and metals"
          color={colors.chartOne}
          onPress={() => router.push('/(tabs)/smsf')}
          desktop={isDesktopWeb}
        />
        <DashboardTile
          icon="cash-outline"
          label="Passive income"
          value={formatCurrency(dashboard.passiveIncomeMonthly)}
          helper="Monthly estimate"
          color={colors.chartThree}
          desktop={isDesktopWeb}
        />
      </View>

      <View style={[styles.desktopColumns, !isDesktopWeb && styles.mobileStack]}>
        <View style={styles.desktopPrimary}>
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Portfolio allocation" action="Tap assets" />
          </View>
      <Panel style={styles.allocationPanel}>
            <AllocationChart items={dashboard.allocation} colors={colors} />
          </Panel>
        </View>

        <View style={styles.desktopSecondary}>
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Warnings and opportunities" />
          </View>
          <Panel style={styles.insightPanel}>
            {dashboard.warnings.map((warning, index) => (
              <Pressable key={warning} style={[styles.insightRow, { borderBottomColor: colors.border }]} onPress={() => router.push(index > 1 ? '/(tabs)/smsf' : '/(tabs)/ai')}>
                <View style={[styles.insightIcon, { backgroundColor: warning.includes('below') || warning.includes('tight') ? '#3A2A12' : '#143425' }]}>
                  <Ionicons
                    name={warning.includes('below') || warning.includes('tight') ? 'warning-outline' : 'checkmark-circle-outline'}
                    color={warning.includes('below') || warning.includes('tight') ? colors.warning : colors.success}
                    size={18}
                  />
                </View>
                <View style={styles.insightCopy}>
                  <Text weight="800">{warning}</Text>
                  <Text variant="small" subtle>
                    Open the affected view for detail
                  </Text>
                </View>
                <Ionicons name="chevron-forward" color={colors.muted} size={18} />
              </Pressable>
            ))}
          </Panel>
        </View>
      </View>

      <View style={[styles.desktopColumns, !isDesktopWeb && styles.mobileStack]}>
        <View style={styles.desktopSecondary}>
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Drill-downs" />
          </View>
          <View style={styles.drillGrid}>
            <DrillCard
              icon="home-outline"
              title="Property centre"
              subtitle="Current properties, bills and ownership"
              onPress={() => router.push('/(tabs)/property')}
            />
            <DrillCard
              icon="calculator-outline"
              title="Deal analyser"
              subtitle="Run a new property purchase scenario"
              onPress={() => router.push('/(tabs)/analyser')}
            />
            <DrillCard
              icon="wallet-outline"
              title="Budget pressure"
              subtitle="Income, bills and wasteful spend"
              onPress={() => router.push('/(tabs)/budget')}
            />
            <DrillCard
              icon="podium-outline"
              title="Bullion lots"
              subtitle="Gold and silver versus spot"
              onPress={() => router.push({ pathname: '/assets/bullion/[id]', params: { id: 'bullion-gold-1' } })}
            />
            <DrillCard
              icon="calendar-outline"
              title="Tax and audit"
              subtitle="PAYG, investments and SMSF checklist"
              onPress={() => router.push('/tax')}
            />
          </View>
        </View>

        <View style={styles.desktopPrimary}>
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Recent activity" action="Manual data" />
          </View>
          <Panel style={styles.activityPanel}>
            {dashboard.recentActivity.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </Panel>
        </View>
      </View>
    </Screen>
  );
}

function InlineMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.inlineMetric}>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <Text variant="section" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function DashboardTile({
  icon,
  label,
  value,
  helper,
  color,
  onPress,
  desktop,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  helper: string;
  color: string;
  onPress?: () => void;
  desktop?: boolean;
}) {
  const { colors } = useWealthTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.tile,
        desktop && styles.tileDesktop,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.tileTopRow}>
        <View style={[styles.tileIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} color={color} size={18} />
        </View>
        {onPress ? <Ionicons name="chevron-forward" color={colors.muted} size={16} /> : null}
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
    </Pressable>
  );
}

function StartAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useWealthTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.startAction,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <Ionicons name={icon} color={colors.accentStrong} size={18} />
      <Text weight="900">{label}</Text>
    </Pressable>
  );
}

function AllocationChart({ items, colors }: { items: AllocationItem[]; colors: WealthColors }) {
  return (
      <View style={styles.allocationWrap}>
      <View style={[styles.segmentTrack, { backgroundColor: colors.surfaceRaised }]}>
        {items.map((item) => (
          <View
            key={item.label}
            style={{
              width: `${Math.max(item.percent, 4)}%`,
              backgroundColor: colors[item.colorKey],
            }}
          >
            <View style={[styles.segmentHighlight, { backgroundColor: `${colors.chartFive}55` }]} />
          </View>
        ))}
      </View>
      <View style={styles.allocationList}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            style={[styles.allocationRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              if (item.label.includes('Bullion')) {
                router.push({ pathname: '/assets/bullion/[id]', params: { id: 'bullion-gold-1' } });
                return;
              }
              if (item.label.includes('Property')) {
                router.push('/(tabs)/property');
                return;
              }
              if (item.label.includes('ETF') || item.label.includes('Crypto')) {
                router.push('/(tabs)/investments');
                return;
              }
              router.push('/(tabs)/super');
            }}
          >
            <View style={styles.allocationLeft}>
              <View style={[styles.allocationDot, { backgroundColor: colors[item.colorKey] }]} />
              <View>
                <Text weight="800">{item.label}</Text>
                <Text variant="small" subtle>
                  {formatPercent(item.percent)} allocation
                </Text>
              </View>
            </View>
            <View style={styles.allocationRight}>
              <Text weight="800">{formatCurrency(item.value)}</Text>
              <Ionicons name="chevron-forward" color={colors.muted} size={16} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DrillCard({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  const { colors } = useWealthTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.drillCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <View style={[styles.drillIcon, { backgroundColor: colors.surfaceRaised }]}>
        <Ionicons name={icon} color={colors.accentStrong} size={20} />
      </View>
      <View style={styles.drillCopy}>
        <Text weight="800">{title}</Text>
        <Text variant="small" subtle>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.muted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  headerCopy: {
    gap: 4,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  brandRule: {
    borderRadius: 99,
    height: 4,
    width: 44,
  },
  title: {
    marginTop: 2,
  },
  askButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
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
    height: 180,
    position: 'absolute',
    right: -40,
    top: -28,
    transform: [{ rotate: '8deg' }],
    width: 320,
  },
  heroGlowSecondary: {
    bottom: -26,
    height: 120,
    left: -30,
    position: 'absolute',
    transform: [{ rotate: '-5deg' }],
    width: 260,
  },
  heroLine: {
    height: 2,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 0,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroValue: {
    fontSize: 36,
    marginTop: 6,
  },
  heroSummary: {
    lineHeight: 21,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
  },
  heroBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  startPanel: {
    gap: 18,
  },
  startPanelDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  startCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  startActions: {
    flexWrap: 'wrap',
    gap: 8,
  },
  startAction: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  inlineMetric: {
    flex: 1,
    gap: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricGridDesktop: {
    flexWrap: 'nowrap',
  },
  tile: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 8,
    minHeight: 142,
    minWidth: 156,
    padding: 15,
    width: '47%',
  },
  tileDesktop: {
    flexBasis: 0,
    flexShrink: 1,
    minWidth: 0,
    width: undefined,
  },
  tileTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sectionSpacing: {
    marginTop: 4,
  },
  desktopColumns: {
    flexDirection: 'row',
    gap: 18,
  },
  mobileStack: {
    flexDirection: 'column',
  },
  desktopPrimary: {
    flex: 1.35,
    gap: 12,
    minWidth: 0,
  },
  desktopSecondary: {
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  allocationPanel: {
    paddingTop: 18,
  },
  allocationWrap: {
    gap: 16,
  },
  segmentTrack: {
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
  allocationList: {
    gap: 2,
  },
  allocationRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  allocationLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  allocationDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  allocationRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  insightPanel: {
    paddingVertical: 6,
  },
  insightRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
  },
  insightIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  insightCopy: {
    flex: 1,
    gap: 3,
  },
  drillGrid: {
    gap: 12,
  },
  drillCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 78,
    padding: 15,
  },
  drillIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  drillCopy: {
    flex: 1,
    gap: 3,
  },
  activityPanel: {
    paddingVertical: 8,
  },
});
