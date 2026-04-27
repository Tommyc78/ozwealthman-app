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
import { demoData } from '@/data/seed';
import { getSuperProjection } from '@/services/calculations';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

type SuperScenario = {
  annualExtra: number;
  annualFees: number;
  netAnnualImpact: number;
  labels: string[];
  baseValues: number[];
  configuredValues: number[];
  extraContribution: number;
  frequency: 'weekly' | 'monthly';
  age60: number;
  age67: number;
};

export function SuperProjectionScreen() {
  const { colors } = useWealthTheme();
  const base = getSuperProjection();
  const extra = getSuperProjection(demoData, 100, 'weekly');
  const chartWidth = Math.min(Dimensions.get('window').width - 32, 680);
  const [extraContribution, setExtraContribution] = useState('100');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [adminFee, setAdminFee] = useState('390');
  const [investmentFeeRate, setInvestmentFeeRate] = useState('0.65');
  const [tpdInsurance, setTpdInsurance] = useState('520');
  const [incomeProtection, setIncomeProtection] = useState('880');
  const [pendingScenario, setPendingScenario] = useState<SuperScenario | undefined>();
  const [savedScenario, setSavedScenario] = useState<SuperScenario | undefined>();
  const configured = useMemo<SuperScenario>(() => {
    const annualExtra = Number(extraContribution) * (frequency === 'weekly' ? 52 : 12);
    const annualFees =
      Number(adminFee) + Number(tpdInsurance) + Number(incomeProtection) + base.currentBalance * ((Number(investmentFeeRate) || 0) / 100);
    const netAnnualImpact = annualExtra - annualFees;
    const labels = ['Now', '45', '50', '55', '60', '67'];
    const baseValues = [base.currentBalance, base.currentBalance * 1.32, base.currentBalance * 1.74, base.currentBalance * 2.22, base.age60, base.age67];
    const configuredValues = baseValues.map((value, index) => value + Math.max(netAnnualImpact, -15000) * index * 4.4);

    return {
      annualExtra,
      annualFees,
      netAnnualImpact,
      labels,
      baseValues,
      configuredValues,
      extraContribution: Number(extraContribution),
      frequency,
      age60: configuredValues[4],
      age67: configuredValues[5],
    };
  }, [adminFee, base.age60, base.age67, base.currentBalance, extraContribution, frequency, incomeProtection, investmentFeeRate, tpdInsurance]);
  const displayedScenario = savedScenario ?? configured;

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View>
        <Text variant="small" subtle weight="800">
          SUPER
        </Text>
        <Text variant="title">Projection engine</Text>
      </View>

      <Panel style={{ backgroundColor: colors.surfaceRaised }}>
        <Text variant="label" subtle>
          CURRENT SUPER BALANCE
        </Text>
        <Text variant="title">{formatCurrency(base.currentBalance)}</Text>
        <Text subtle>Projection uses stored data and deterministic assumptions. It is not personal financial advice.</Text>
      </Panel>

      <View style={styles.grid}>
        <StatCard label="Employer estimate" value={formatCurrency(base.annualSalaryContributions)} helper="Annual contributions" />
        <StatCard label="Age 60" value={formatCurrency(base.age60)} helper="Base trajectory" />
        <StatCard label="Age 67" value={formatCurrency(base.age67)} helper="Base trajectory" />
        <StatCard label="$100/w impact" value={formatCurrency(extra.age67 - base.age67)} helper="Extra by age 67" tone="positive" />
      </View>

      <SectionHeader title="Projection graph" action="Base vs configured" />
      <Panel style={styles.chartPanel}>
        <LineChart
          data={{
            labels: configured.labels,
            datasets: [
              { data: configured.baseValues, color: () => colors.muted },
              { data: displayedScenario.configuredValues, color: () => colors.accent },
            ],
          }}
          width={chartWidth}
          height={250}
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

      <SectionHeader title="Contribution and fee modeller" action="User configurable" />
      <Panel style={styles.formPanel}>
        <Text subtle>Model the drag from administration fees, investment fees, TPD and income protection before comparing extra contribution scenarios.</Text>
        <View style={styles.inputGrid}>
          <Field label="Extra contribution" value={extraContribution} onChangeText={setExtraContribution} />
          <Field label="Admin fee p.a." value={adminFee} onChangeText={setAdminFee} />
          <Field label="Investment fee %" value={investmentFeeRate} onChangeText={setInvestmentFeeRate} />
          <Field label="TPD insurance p.a." value={tpdInsurance} onChangeText={setTpdInsurance} />
          <Field label="Income protection p.a." value={incomeProtection} onChangeText={setIncomeProtection} />
        </View>
        <View style={styles.chipRow}>
          {(['weekly', 'monthly'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setFrequency(item)}
              style={[styles.chip, { backgroundColor: frequency === item ? colors.accent : colors.surfaceRaised, borderColor: frequency === item ? colors.accent : colors.border }]}
            >
              <Text weight="800" style={{ color: frequency === item ? colors.background : colors.text }}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        <MetricRow label="Extra contribution p.a." value={formatCurrency(configured.annualExtra)} tone="positive" />
        <MetricRow label="Estimated fee and insurance drag p.a." value={formatCurrency(configured.annualFees)} tone="warning" />
        <MetricRow label="Net annual modelling impact" value={formatCurrency(configured.netAnnualImpact)} tone={configured.netAnnualImpact >= 0 ? 'positive' : 'danger'} />
        <PrimaryButton label="Prepare super scenario" onPress={() => setPendingScenario(configured)} />
        {pendingScenario ? (
          <View style={[styles.pendingBox, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
            <View style={styles.pendingCopy}>
              <Text weight="900">Pending super scenario</Text>
              <Text variant="small" subtle>
                {formatCurrency(pendingScenario.extraContribution)} {pendingScenario.frequency}, less {formatCurrency(pendingScenario.annualFees)} p.a. in fees and insurance.
              </Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => {
                  setSavedScenario(pendingScenario);
                  setPendingScenario(undefined);
                }}
                style={[styles.smallAction, { backgroundColor: colors.success }]}
              >
                <Text weight="900" style={{ color: colors.background }}>
                  Confirm
                </Text>
              </Pressable>
              <Pressable onPress={() => setPendingScenario(undefined)} style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {savedScenario ? (
          <View style={[styles.pendingBox, { backgroundColor: colors.surfaceRaised, borderColor: colors.success }]}>
            <Text weight="900" style={{ color: colors.success }}>
              Scenario applied to graph
            </Text>
            <Text variant="small" subtle>
              Age 60: {formatCurrency(savedScenario.age60)} - Age 67: {formatCurrency(savedScenario.age67)}
            </Text>
          </View>
        ) : null}
      </Panel>

      <SectionHeader title="Contribution scenarios" />
      <Panel>
        <MetricRow label="Base projection at age 60" value={formatCurrency(base.age60)} />
        <MetricRow label="Base projection at age 67" value={formatCurrency(base.age67)} />
        <MetricRow label="$100 weekly extra at age 60" value={formatCurrency(extra.age60)} tone="positive" />
        <MetricRow label="$100 weekly extra at age 67" value={formatCurrency(extra.age67)} tone="positive" />
      </Panel>

      <SectionHeader title="Retirement gap" />
      <Panel>
        <Text weight="800">{formatCurrency(base.retirementGapAt67)} gap to target at age 67.</Text>
        <Text subtle>
          The AI coach can explain scenarios, but the projection values come from the calculation service using stored balance, salary and contribution assumptions.
        </Text>
      </Panel>
    </Screen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors } = useWealthTheme();

  return (
    <View style={styles.field}>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        keyboardType="numeric"
        onChangeText={onChangeText}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartPanel: {
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 8,
    marginLeft: -18,
  },
  formPanel: {
    gap: 12,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    flexGrow: 1,
    gap: 6,
    minWidth: 180,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontWeight: '800',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallAction: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
