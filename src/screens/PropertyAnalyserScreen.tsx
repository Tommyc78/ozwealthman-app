import { useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { demoData } from '@/data/seed';
import { analyseProperty, createPropertyResearchBrief } from '@/services/propertyServices';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { PropertyAnalysisInput } from '@/types/models';
import { formatCurrency, formatPercent } from '@/utils/format';

type NumericKey =
  | 'purchase_price'
  | 'deposit'
  | 'loan_amount'
  | 'interest_rate'
  | 'low_weekly_rent'
  | 'high_weekly_rent'
  | 'vacancy_rate'
  | 'annual_rates'
  | 'annual_water_rates'
  | 'annual_body_corporate'
  | 'annual_insurance'
  | 'annual_landlord_insurance'
  | 'annual_repairs'
  | 'management_fee_rate'
  | 'stamp_duty'
  | 'legal_and_buying_costs'
  | 'buffer'
  | 'projected_growth_rate';

const defaultInput = demoData.propertyAnalysisInputs[0];

export function PropertyAnalyserScreen() {
  const { colors } = useWealthTheme();
  const chartWidth = Math.min(Dimensions.get('window').width - 32, 760);
  const [input, setInput] = useState<PropertyAnalysisInput>(defaultInput);
  const [otherExpenses, setOtherExpenses] = useState<Array<{ id: string; name: string; amount: number }>>([]);
  const [expenseDraft, setExpenseDraft] = useState({ name: '', amount: '' });
  const [taxSettings, setTaxSettings] = useState({
    enabled: true,
    marginalRate: '37',
    annualDepreciation: '8500',
    scheduleUploaded: false,
    scheduleFileName: '',
    scheduleFileSize: 0,
  });

  const adjustedInput = useMemo(
    () => ({
      ...input,
      annual_repairs: input.annual_repairs + otherExpenses.reduce((total, item) => total + item.amount, 0),
    }),
    [input, otherExpenses],
  );
  const analysis = useMemo(() => analyseProperty(adjustedInput), [adjustedInput]);
  const research = useMemo(() => createPropertyResearchBrief(input.suburb, input.state), [input.suburb, input.state]);
  const gearing = useMemo(() => {
    const depreciation = Number(taxSettings.annualDepreciation) || 0;
    const taxRate = (Number(taxSettings.marginalRate) || 0) / 100;
    const rentGrowth = 0.03;
    const expenseGrowth = 0.025;
    const principalPaydown = adjustedInput.loan_amount * 0.018;
    const points = Array.from({ length: 11 }, (_, year) => {
      const rent = analysis.annualRent * (1 + rentGrowth) ** year;
      const expenses = analysis.operatingExpenses * (1 + expenseGrowth) ** year;
      const interest = Math.max(adjustedInput.loan_amount - principalPaydown * year, 0) * adjustedInput.interest_rate;
      const beforeTax = rent - expenses - interest;
      const taxablePosition = rent - expenses - interest - depreciation;
      const taxBenefit = taxSettings.enabled && taxablePosition < 0 ? Math.abs(taxablePosition) * taxRate : 0;
      return {
        year,
        beforeTax,
        afterTax: beforeTax + taxBenefit,
      };
    });
    const greenYear = points.find((point) => point.afterTax >= 0)?.year;
    return { points, greenYear, depreciation, taxRate };
  }, [adjustedInput.interest_rate, adjustedInput.loan_amount, analysis.annualRent, analysis.operatingExpenses, taxSettings]);

  function updateNumber(key: NumericKey, value: string, percent = false) {
    const parsed = Number(value.replace(/[$,%\s,]/g, ''));
    const next = Number.isFinite(parsed) ? (percent ? parsed / 100 : parsed) : 0;
    setInput((current) => {
      const updated = { ...current, [key]: next };
      if (key === 'purchase_price') {
        updated.deposit = Math.round(next * 0.2);
        updated.loan_amount = Math.round(next * 0.8);
      }
      return updated;
    });
  }

  function updateText(key: 'name' | 'suburb' | 'state' | 'property_type', value: string) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View>
        <Text variant="small" subtle weight="800">
          OZWEALTHMAN PROPERTY ANALYSER
        </Text>
        <Text variant="title">Run the deal</Text>
        <Text subtle>Put in the numbers before you buy. See cash required, running costs, yield, cashflow and 10-year hold/sell outcomes.</Text>
      </View>

      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <View style={styles.heroBackdrop} pointerEvents="none">
          <View style={[styles.heroGlowPrimary, { backgroundColor: `${colors.accent}14` }]} />
          <View style={[styles.heroGlowSecondary, { backgroundColor: `${colors.chartFive}18` }]} />
          <View style={[styles.heroLine, { backgroundColor: `${colors.chartFive}55` }]} />
        </View>
        <Text variant="label" subtle>
          DEAL VERDICT
        </Text>
        <Text variant="title" style={styles.verdict}>
          {analysis.verdict}
        </Text>
        <View style={styles.heroGrid}>
          <InlineMetric label="Cash required" value={formatCurrency(analysis.cashRequired)} color={colors.accentStrong} />
          <InlineMetric label="Monthly cashflow" value={formatCurrency(analysis.monthlyCashflowBeforeTax)} color={analysis.monthlyCashflowBeforeTax >= 0 ? colors.success : colors.warning} />
          <InlineMetric label="Gross yield" value={formatPercent(analysis.grossYield)} color={colors.chartTwo} />
        </View>
      </Panel>

      <SectionHeader title="Buy recommendation" />
      <Panel
        style={[
          styles.verdictPanel,
          {
            borderColor: analysis.riskScore >= 7 ? colors.danger : analysis.riskScore >= 5 ? colors.warning : colors.success,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      >
        <View style={styles.scoreRow}>
          <ScorePill label="Buy score" value={`${analysis.buyScore}/5`} color={analysis.buyScore >= 4 ? colors.success : analysis.buyScore >= 3 ? colors.warning : colors.danger} />
          <ScorePill label="Risk score" value={`${analysis.riskScore}/10`} color={analysis.riskScore <= 4 ? colors.success : analysis.riskScore <= 7 ? colors.warning : colors.danger} />
        </View>
        <Text weight="800">{analysis.recommendation}</Text>
        <Text variant="small" subtle>
          Scoring considers yield, before-tax cashflow, interest coverage, operating cost drag, cash required, vacancy assumption, body corporate exposure and growth assumption.
        </Text>
        <View style={styles.reasonGrid}>
          <View style={styles.reasonColumn}>
            <Text variant="label" subtle>
              STRENGTHS
            </Text>
            {analysis.strengths.map((item) => (
              <Text key={item} variant="small" style={{ color: colors.success }}>
                {item}
              </Text>
            ))}
          </View>
          <View style={styles.reasonColumn}>
            <Text variant="label" subtle>
              RISKS
            </Text>
            {analysis.risks.map((item) => (
              <Text key={item} variant="small" style={{ color: colors.warning }}>
                {item}
              </Text>
            ))}
          </View>
        </View>
      </Panel>

      <SectionHeader title="Cashflow path to green" action="Negative gearing option" />
      <Panel style={styles.chartPanel}>
        <Text subtle>Shows estimated before-tax and after-tax cashflow as rent grows and the loan is gradually paid down. Tax settings are estimates only.</Text>
        <LineChart
          data={{
            labels: ['Y0', 'Y2', 'Y4', 'Y6', 'Y8', 'Y10'],
            datasets: [
              { data: gearing.points.filter((point) => point.year % 2 === 0).map((point) => point.beforeTax), color: () => colors.warning },
              { data: gearing.points.filter((point) => point.year % 2 === 0).map((point) => point.afterTax), color: () => colors.success },
            ],
          }}
          width={chartWidth}
          height={240}
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
        <MetricRow label="Estimated year it goes green" value={gearing.greenYear === undefined ? 'Not within 10 years' : `Year ${gearing.greenYear}`} tone={gearing.greenYear === undefined ? 'warning' : 'positive'} />
        <MetricRow label="Year 1 after-tax cashflow" value={formatCurrency(gearing.points[0].afterTax)} tone={gearing.points[0].afterTax >= 0 ? 'positive' : 'danger'} />
        <MetricRow label="Year 10 after-tax cashflow" value={formatCurrency(gearing.points[10].afterTax)} tone={gearing.points[10].afterTax >= 0 ? 'positive' : 'danger'} />
      </Panel>

      <SectionHeader title="Property and rent" />
      <Panel>
        <InputRow label="Deal name" value={input.name} onChangeText={(value) => updateText('name', value)} />
        <InputRow label="Suburb" value={input.suburb} onChangeText={(value) => updateText('suburb', value)} />
        <InputRow label="State" value={input.state} onChangeText={(value) => updateText('state', value)} />
        <InputRow label="Type" value={input.property_type ?? ''} onChangeText={(value) => updateText('property_type', value)} />
        <MoneyInput label="Purchase price" value={input.purchase_price} onChangeText={(value) => updateNumber('purchase_price', value)} />
        <MoneyInput label="Low weekly rent" value={input.low_weekly_rent ?? input.weekly_rent} onChangeText={(value) => updateNumber('low_weekly_rent', value)} />
        <MoneyInput label="High weekly rent" value={input.high_weekly_rent ?? input.weekly_rent} onChangeText={(value) => updateNumber('high_weekly_rent', value)} />
        <PercentInput label="Vacancy rate" value={input.vacancy_rate} onChangeText={(value) => updateNumber('vacancy_rate', value, true)} />
      </Panel>

      <SectionHeader title="Buying costs and debt" />
      <Panel>
        <MoneyInput label="Deposit" value={input.deposit} onChangeText={(value) => updateNumber('deposit', value)} />
        <MoneyInput label="Loan amount" value={input.loan_amount} onChangeText={(value) => updateNumber('loan_amount', value)} />
        <PercentInput label="Interest rate" value={input.interest_rate} onChangeText={(value) => updateNumber('interest_rate', value, true)} />
        <MoneyInput label="Stamp duty" value={input.stamp_duty} onChangeText={(value) => updateNumber('stamp_duty', value)} />
        <MoneyInput label="Legals and reports" value={input.legal_and_buying_costs} onChangeText={(value) => updateNumber('legal_and_buying_costs', value)} />
        <MoneyInput label="Buffer" value={input.buffer} onChangeText={(value) => updateNumber('buffer', value)} />
      </Panel>

      <SectionHeader title="Running costs" />
      <Panel>
        <MoneyInput label="Council rates" value={input.annual_rates} onChangeText={(value) => updateNumber('annual_rates', value)} />
        <MoneyInput label="Water rates" value={input.annual_water_rates} onChangeText={(value) => updateNumber('annual_water_rates', value)} />
        <MoneyInput label="Body corporate" value={input.annual_body_corporate} onChangeText={(value) => updateNumber('annual_body_corporate', value)} />
        <MoneyInput label="Building insurance" value={input.annual_insurance} onChangeText={(value) => updateNumber('annual_insurance', value)} />
        <MoneyInput label="Landlord insurance" value={input.annual_landlord_insurance} onChangeText={(value) => updateNumber('annual_landlord_insurance', value)} />
        <MoneyInput label="Repairs allowance" value={input.annual_repairs} onChangeText={(value) => updateNumber('annual_repairs', value)} />
        <PercentInput label="Management fee" value={input.management_fee_rate} onChangeText={(value) => updateNumber('management_fee_rate', value, true)} />
      </Panel>

      <SectionHeader title="Negative gearing and depreciation" />
      <Panel style={styles.otherPanel}>
        <Text subtle>Use this to estimate after-tax cashflow. A future secure document parser can read depreciation schedules and feed this value into the calculation.</Text>
        <View style={styles.otherInputRow}>
          <Pressable
            onPress={() => setTaxSettings((current) => ({ ...current, enabled: !current.enabled }))}
            style={[styles.chip, { backgroundColor: taxSettings.enabled ? colors.accent : colors.surfaceRaised, borderColor: taxSettings.enabled ? colors.accent : colors.border }]}
          >
            <Text weight="900" style={{ color: taxSettings.enabled ? colors.background : colors.text }}>
              Negative gearing {taxSettings.enabled ? 'on' : 'off'}
            </Text>
          </Pressable>
          <View style={styles.taxField}>
            <Text variant="small" subtle weight="800">
              MARGINAL TAX RATE %
            </Text>
            <TextInput
              placeholder="e.g. 37"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={taxSettings.marginalRate}
              onChangeText={(value) => setTaxSettings((current) => ({ ...current, marginalRate: value }))}
              style={[styles.input, styles.otherAmount, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
          <View style={styles.taxField}>
            <Text variant="small" subtle weight="800">
              ANNUAL DEPRECIATION
            </Text>
            <TextInput
              placeholder="e.g. 8500"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={taxSettings.annualDepreciation}
              onChangeText={(value) => setTaxSettings((current) => ({ ...current, annualDepreciation: value }))}
              style={[styles.input, styles.otherAmount, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
              const inputElement = document.createElement('input');
              inputElement.type = 'file';
              inputElement.accept = '.pdf,.xlsx,.xls,.csv';
              inputElement.onchange = () => {
                const file = inputElement.files?.[0];
                if (!file) {
                  return;
                }
                setTaxSettings((current) => ({
                  ...current,
                  scheduleUploaded: true,
                  scheduleFileName: file.name,
                  scheduleFileSize: file.size,
                }));
              };
              inputElement.click();
              return;
            }
            setTaxSettings((current) => ({ ...current, scheduleUploaded: true, scheduleFileName: 'Depreciation schedule selected', scheduleFileSize: 0 }));
          }}
          style={[styles.uploadBox, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
        >
          <Text weight="900">Upload depreciation schedule</Text>
          <Text variant="small" subtle>
            {taxSettings.scheduleUploaded
              ? `${taxSettings.scheduleFileName || 'Schedule selected'} queued for AI/parser extraction`
              : 'Choose PDF, XLSX, XLS or CSV'}
          </Text>
        </Pressable>
        {taxSettings.scheduleUploaded ? (
          <MetricRow label="Uploaded schedule" value={taxSettings.scheduleFileSize ? `${Math.round(taxSettings.scheduleFileSize / 1024)} KB` : 'Selected'} tone="positive" />
        ) : null}
        <MetricRow label="Depreciation used in model" value={formatCurrency(gearing.depreciation)} />
        <MetricRow label="Marginal tax rate used" value={`${(gearing.taxRate * 100).toFixed(1)}%`} />
      </Panel>

      <SectionHeader title="Other expenses" action="Add anything missing" />
      <Panel style={styles.otherPanel}>
        <Text subtle>Use this for deal-specific costs not covered above: pool, smoke alarm compliance, pest treatment, leasing fee, garden, fire safety, land tax estimate or anything unusual.</Text>
        <View style={styles.otherInputRow}>
          <TextInput
            placeholder="Expense name"
            placeholderTextColor={colors.muted}
            value={expenseDraft.name}
            onChangeText={(value) => setExpenseDraft((current) => ({ ...current, name: value }))}
            style={[styles.input, styles.otherInput, { borderColor: colors.border, color: colors.text }]}
          />
          <TextInput
            placeholder="Annual amount"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={expenseDraft.amount}
            onChangeText={(value) => setExpenseDraft((current) => ({ ...current, amount: value }))}
            style={[styles.input, styles.otherAmount, { borderColor: colors.border, color: colors.text }]}
          />
          <Pressable
            onPress={() => {
              const amount = Number(expenseDraft.amount);
              if (!expenseDraft.name.trim() || amount <= 0) {
                return;
              }
              setOtherExpenses((current) => [{ id: `expense-${Date.now()}`, name: expenseDraft.name.trim(), amount }, ...current]);
              setExpenseDraft({ name: '', amount: '' });
            }}
            style={[styles.plusButton, { backgroundColor: colors.accent }]}
          >
            <Text variant="section" style={{ color: colors.background }}>
              +
            </Text>
          </Pressable>
        </View>
        {otherExpenses.map((expense) => (
          <View key={expense.id} style={[styles.expenseRow, { borderBottomColor: colors.border }]}>
            <Text weight="800">{expense.name}</Text>
            <Text subtle>{formatCurrency(expense.amount)} p.a.</Text>
            <Pressable onPress={() => setOtherExpenses((current) => current.filter((item) => item.id !== expense.id))}>
              <Text style={{ color: colors.danger }} weight="900">
                Remove
              </Text>
            </Pressable>
          </View>
        ))}
        <MetricRow label="Other expenses included" value={formatCurrency(otherExpenses.reduce((total, item) => total + item.amount, 0))} tone="warning" />
      </Panel>

      <SectionHeader title="Investment outcomes" />
      <Panel>
        <MetricRow label="Low rent monthly cashflow" value={formatCurrency(analysis.lowMonthlyCashflowBeforeTax)} tone={analysis.lowMonthlyCashflowBeforeTax >= 0 ? 'positive' : 'danger'} />
        <MetricRow label="High rent monthly cashflow" value={formatCurrency(analysis.highMonthlyCashflowBeforeTax)} tone={analysis.highMonthlyCashflowBeforeTax >= 0 ? 'positive' : 'danger'} />
        <MetricRow label="Operating expenses" value={formatCurrency(analysis.operatingExpenses)} tone="warning" />
        <MetricRow label="Annual interest" value={formatCurrency(analysis.annualInterest)} tone="warning" />
        <MetricRow label="Cash-on-cash return" value={formatPercent(analysis.cashOnCashReturn)} tone={analysis.cashOnCashReturn >= 0 ? 'positive' : 'warning'} />
      </Panel>

      <SectionHeader title="10-year hold versus sell" />
      <Panel>
        <PercentInput label="Growth assumption" value={input.projected_growth_rate} onChangeText={(value) => updateNumber('projected_growth_rate', value, true)} />
        <MetricRow label="Estimated year 10 value" value={formatCurrency(analysis.projectedYearTenValue)} tone="positive" />
        <MetricRow label="Equity if held" value={formatCurrency(analysis.yearTenEquityIfHeld)} tone="positive" />
        <MetricRow label="10-year cashflow before tax" value={formatCurrency(analysis.tenYearCashflowBeforeTax)} tone={analysis.tenYearCashflowBeforeTax >= 0 ? 'positive' : 'danger'} />
        <MetricRow label="Net sale proceeds after loan/costs" value={formatCurrency(analysis.netSaleProceedsYearTen)} />
        <MetricRow label="Total hold return before tax" value={formatCurrency(analysis.totalHoldReturnBeforeTax)} tone={analysis.totalHoldReturnBeforeTax >= 0 ? 'positive' : 'danger'} />
        <MetricRow label="Total sell return before tax" value={formatCurrency(analysis.totalSellReturnBeforeTax)} tone={analysis.totalSellReturnBeforeTax >= 0 ? 'positive' : 'danger'} />
      </Panel>

      <SectionHeader title="Area intelligence" />
      <Panel>
        <Text weight="800">
          {input.suburb}, {input.state}
        </Text>
        <Text subtle>{research.summary}</Text>
        <MetricRow label="Rental yield comparisons" value="Provider ready" />
        <Text variant="small" subtle>{research.rentalYieldComparison}</Text>
        <MetricRow label="History of growth" value="Provider ready" />
        <Text variant="small" subtle>{research.growthHistory}</Text>
        <MetricRow label="Upcoming projects" value="Provider ready" />
        <Text variant="small" subtle>{research.projectPipeline}</Text>
        <MetricRow label="People movement" value="Provider ready" />
        <Text variant="small" subtle>{research.populationMovement}</Text>
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

function ScorePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.scorePill, { borderColor: color }]}>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <Text variant="section" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function InputRow({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors } = useWealthTheme();
  return (
    <View style={styles.inputRow}>
      <Text subtle>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.muted} />
    </View>
  );
}

function MoneyInput({ label, value, onChangeText }: { label: string; value: number; onChangeText: (value: string) => void }) {
  return <InputRow label={label} value={String(Math.round(value))} onChangeText={onChangeText} />;
}

function PercentInput({ label, value, onChangeText }: { label: string; value: number; onChangeText: (value: string) => void }) {
  return <InputRow label={label} value={(value * 100).toFixed(2)} onChangeText={onChangeText} />;
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  hero: { gap: 16, overflow: 'hidden', position: 'relative' },
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
  verdict: { fontSize: 28 },
  heroGrid: { flexDirection: 'row', gap: 12 },
  inlineMetric: { flex: 1, gap: 4 },
  scoreRow: { flexDirection: 'row', gap: 12 },
  verdictPanel: { gap: 12 },
  scorePill: { borderRadius: 8, borderWidth: 1, flex: 1, gap: 4, padding: 12 },
  chartPanel: { gap: 12, overflow: 'hidden' },
  chart: { borderRadius: 8, marginLeft: -18 },
  reasonGrid: { gap: 12 },
  reasonColumn: { gap: 7 },
  inputRow: { gap: 7 },
  input: { borderRadius: 8, borderWidth: 1, minHeight: 42, paddingHorizontal: 12 },
  otherPanel: { gap: 12 },
  otherInputRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  otherInput: { flex: 1, minWidth: 220 },
  otherAmount: { width: 160 },
  taxField: { gap: 6 },
  plusButton: { alignItems: 'center', borderRadius: 8, height: 42, justifyContent: 'center', width: 42 },
  expenseRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 10 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  uploadBox: { borderRadius: 8, borderWidth: 1, gap: 4, padding: 14 },
});
