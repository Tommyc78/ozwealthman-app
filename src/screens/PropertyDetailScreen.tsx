import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useMemo, useState } from 'react';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { createPropertyBusinessProjection, getPropertyBillSummary, getPropertyDetail } from '@/services/propertyServices';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { PropertyBill, PropertyBillType } from '@/types/models';
import { formatCurrency } from '@/utils/format';

function calculateAmortization(balance: number, annualRate: number, monthlyPayment: number, extraMonthly = 0) {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayment = monthlyPayment + extraMonthly;

  if (totalPayment <= balance * monthlyRate) {
    return { points: [{ year: 0, balance }], totalMonths: 999, totalInterest: 0 };
  }

  const points: { year: number; balance: number }[] = [{ year: 0, balance }];
  let remaining = balance;
  let month = 0;
  let totalInterest = 0;

  while (remaining > 0 && month < 480) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining = remaining + interest - totalPayment;
    if (remaining < 0) {
      remaining = 0;
    }
    month += 1;
    if (month % 12 === 0) {
      points.push({ year: month / 12, balance: Math.round(remaining) });
    }
  }

  if (month % 12 !== 0) {
    points.push({ year: Math.ceil(month / 12), balance: 0 });
  }

  return { points, totalMonths: month, totalInterest: Math.round(totalInterest) };
}

export function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useWealthTheme();
  const { data, updateProperty, addPropertyBill, togglePropertyBillPaid, deletePropertyBill } = useAppData();

  const property = data.propertyHoldings.find((item) => item.id === id);
  const detail = property ? getPropertyDetail(property.id, data) : undefined;
  const billData = property ? getPropertyBillSummary(property.id, data) : undefined;
  const businessProjection = property ? createPropertyBusinessProjection(property.id, data) : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(property?.current_value ?? 0));
  const [editLoan, setEditLoan] = useState(String(property?.loan_balance ?? 0));
  const [editRate, setEditRate] = useState(String(property?.interest_rate ?? 0));
  const [editRepayment, setEditRepayment] = useState(String(property?.monthly_repayment ?? 0));
  const [editRent, setEditRent] = useState(String(property?.weekly_rent ?? 0));
  const [extraRepayment, setExtraRepayment] = useState('');
  const [showBillForm, setShowBillForm] = useState(false);
  const [billForm, setBillForm] = useState({
    vendor: '',
    bill_type: 'water' as PropertyBillType,
    amount: '',
    due_date: '2026-06-30',
    recurrence: 'quarterly' as PropertyBill['recurrence'],
  });

  if (!property || !detail || !billData || !businessProjection) {
    return (
      <Screen>
        <Panel>
          <Text>Property not found.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.accent }}>Go back</Text>
          </Pressable>
        </Panel>
      </Screen>
    );
  }

  const currentValue = Number(editValue) || 0;
  const currentLoan = Number(editLoan) || 0;
  const currentRate = Number(editRate) || 0;
  const currentRepayment = Number(editRepayment) || 0;
  const currentRent = Number(editRent) || 0;
  const extra = Number(extraRepayment) || 0;
  const isSMSF = property.ownership_type === 'smsf';

  const equity = currentValue - currentLoan;
  const debtRatio = currentValue > 0 ? (currentLoan / currentValue) * 100 : 0;
  const grossYield = currentValue > 0 ? ((currentRent * 52) / currentValue) * 100 : 0;

  const standard = useMemo(() => calculateAmortization(currentLoan, currentRate, currentRepayment), [currentLoan, currentRate, currentRepayment]);
  const accelerated = useMemo(
    () => calculateAmortization(currentLoan, currentRate, currentRepayment, extra),
    [currentLoan, currentRate, currentRepayment, extra],
  );

  const chartWidth = Math.max(Math.min(Dimensions.get('window').width - 360, 1040), 320);
  const maxYears = Math.max(standard.points.length, accelerated.points.length);
  const chartLabels: string[] = [];
  const standardData: number[] = [];
  const acceleratedData: number[] = [];

  for (let yearIndex = 0; yearIndex < maxYears; yearIndex += 1) {
    const standardPoint = standard.points[yearIndex];
    const acceleratedPoint = accelerated.points[yearIndex];
    const year = standardPoint?.year ?? acceleratedPoint?.year ?? yearIndex;
    if (year % 2 === 0 || yearIndex === maxYears - 1) {
      chartLabels.push(String(year));
      standardData.push(standardPoint?.balance ?? 0);
      acceleratedData.push(acceleratedPoint?.balance ?? 0);
    }
  }

  if (standardData.length === 0) {
    chartLabels.push('0');
    standardData.push(currentLoan);
    acceleratedData.push(currentLoan);
  }

  const interestSaved = standard.totalInterest - accelerated.totalInterest;
  const timeSavedMonths = standard.totalMonths - accelerated.totalMonths;
  const annualRent = currentRent * 52;
  const annualBills = billData.annualized + (property.annual_expenses ?? 0);
  const annualInterest = currentLoan * (currentRate / 100);
  const annualNetCashflow = annualRent - annualBills - annualInterest;
  const businessLabels = businessProjection.points.map((point) => String(point.year));
  const cumulativeBills = businessProjection.points.map((point) => Math.round(point.cumulativeBills));
  const cumulativeCash = businessProjection.points.map((point) => Math.round(point.cumulativeCashContributed));
  const cumulativeReturn = businessProjection.points.map((point) => Math.round(point.totalBusinessReturn));

  const savePropertyEdits = () => {
    updateProperty(property.id, {
      current_value: currentValue,
      loan_balance: currentLoan,
      interest_rate: currentRate,
      monthly_repayment: currentRepayment,
      weekly_rent: currentRent,
    });
    setIsEditing(false);
  };

  const submitBill = () => {
    const amount = Number(billForm.amount);
    if (!billForm.vendor.trim() || amount <= 0) {
      return;
    }

    addPropertyBill({
      property_id: property.id,
      bill_type: billForm.bill_type,
      vendor: billForm.vendor.trim(),
      amount,
      due_date: billForm.due_date,
      paid_date: undefined,
      recurrence: billForm.recurrence,
      status: 'upcoming',
      notes: 'Added from property detail',
    });
    setBillForm((current) => ({ ...current, vendor: '', amount: '' }));
    setShowBillForm(false);
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.accent} size={18} />
        <Text weight="800" style={{ color: colors.accent }}>
          Properties
        </Text>
      </Pressable>

      <Panel style={[styles.hero, { borderColor: colors.accent }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text variant="title">{property.name}</Text>
            <Text subtle>{property.location}</Text>
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
        </View>

        <View style={styles.heroMetrics}>
          <InlineMetric label="Value" value={formatCurrency(currentValue)} color={colors.text} />
          <InlineMetric label="Equity" value={formatCurrency(equity)} color={colors.success} />
          <InlineMetric label="Debt ratio" value={`${debtRatio.toFixed(1)}%`} color={debtRatio > 80 ? colors.danger : colors.warning} />
          <InlineMetric label="Gross yield" value={`${grossYield.toFixed(1)}%`} color={colors.accentStrong} />
        </View>

        {isSMSF ? (
          <View style={[styles.trustRow, { borderTopColor: colors.border }]}>
            <Text variant="small" subtle weight="800">
              BARE TRUST
            </Text>
            <Text weight="800">{property.bare_trust_name ?? `${property.name} Custodian Pty Ltd ATF Bare Trust`}</Text>
          </View>
        ) : null}
      </Panel>

      <SectionHeader title="Financial details" action={isEditing ? 'Editing' : 'Tap Edit to change'} />
      <Panel>
        {isEditing ? (
          <View style={styles.editGrid}>
            <EditField label="Current value" value={editValue} onChangeText={setEditValue} colors={colors} />
            <EditField label="Loan balance" value={editLoan} onChangeText={setEditLoan} colors={colors} />
            <EditField label="Interest rate %" value={editRate} onChangeText={setEditRate} colors={colors} />
            <EditField label="Monthly repayment" value={editRepayment} onChangeText={setEditRepayment} colors={colors} />
            <EditField label="Weekly rent" value={editRent} onChangeText={setEditRent} colors={colors} />
          </View>
        ) : (
          <View style={styles.detailGrid}>
            <MetricRow label="Current value" value={formatCurrency(currentValue)} />
            <MetricRow label="Loan balance" value={formatCurrency(currentLoan)} />
            <MetricRow label="Interest rate" value={`${currentRate.toFixed(2)}%`} />
            <MetricRow label="Monthly repayment" value={formatCurrency(currentRepayment)} />
            <MetricRow label="Weekly rent" value={formatCurrency(currentRent)} />
          </View>
        )}
        <View style={styles.editActions}>
          {isEditing ? (
            <Pressable onPress={savePropertyEdits} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark-circle" color={colors.background} size={16} />
              <Text weight="900" style={{ color: colors.background }}>
                Save
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setIsEditing(true)} style={[styles.actionBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="pencil" color={colors.background} size={14} />
              <Text weight="900" style={{ color: colors.background }}>
                Edit
              </Text>
            </Pressable>
          )}
        </View>
      </Panel>

      <SectionHeader title="Loan runway" action={`${currentRate.toFixed(2)}% variable`} />
      <Panel style={{ overflow: 'hidden' }}>
        <View style={styles.payoffMetrics}>
          <InlineMetric label="Standard payoff" value={`${Math.ceil(standard.totalMonths / 12)} years`} color={colors.text} />
          <InlineMetric label="Total interest" value={formatCurrency(standard.totalInterest)} color={colors.warning} />
          {extra > 0 ? (
            <>
              <InlineMetric label="Accelerated payoff" value={`${Math.ceil(accelerated.totalMonths / 12)} years`} color={colors.success} />
              <InlineMetric label="Interest saved" value={formatCurrency(interestSaved)} color={colors.success} />
            </>
          ) : null}
        </View>

        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                { data: standardData, color: () => colors.warning, strokeWidth: 3 },
                ...(extra > 0 ? [{ data: acceleratedData, color: () => colors.success, strokeWidth: 3 }] : []),
              ],
              legend: extra > 0 ? ['Standard', 'With extra repayments'] : ['Loan balance'],
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

      <SectionHeader title="Extra repayment modeller" action="See the impact of paying more" />
      <Panel>
        <Text subtle>Enter an extra monthly amount to model accelerated payoff and interest savings.</Text>
        <View style={styles.extraRow}>
          <Text weight="800" style={{ minWidth: 120 }}>
            Extra $/month
          </Text>
          <TextInput
            placeholder="e.g. 500"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={extraRepayment}
            onChangeText={setExtraRepayment}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised, flex: 1 }]}
          />
        </View>
        {extra > 0 ? (
          <View style={[styles.savingsBox, { backgroundColor: `${colors.success}15`, borderColor: colors.success }]}>
            <Ionicons name="trending-down" color={colors.success} size={22} />
            <View style={styles.savingsCopy}>
              <Text weight="900" style={{ color: colors.success }}>
                Save {formatCurrency(interestSaved)} in interest
              </Text>
              <Text subtle>
                Pay off {Math.floor(timeSavedMonths / 12)} years and {timeSavedMonths % 12} months sooner. New total repayment:{' '}
                {formatCurrency(currentRepayment + extra)}/month.
              </Text>
            </View>
          </View>
        ) : null}
      </Panel>

      <SectionHeader title="Run it like a business" action={businessProjection.breakEvenYear ? `Break-even year ${businessProjection.breakEvenYear}` : 'No break-even in 10y'} />
      <Panel style={{ overflow: 'hidden' }}>
        <View style={styles.businessMetrics}>
          <InlineMetric label="10y return" value={formatCurrency(businessProjection.totalReturnTenYear)} color={businessProjection.totalReturnTenYear >= 0 ? colors.success : colors.warning} />
          <InlineMetric label="Cash contributed" value={formatCurrency(businessProjection.cashContributedTenYear)} color={colors.warning} />
          <InlineMetric label="Bills accumulated" value={formatCurrency(businessProjection.totalBillsTenYear)} color={colors.danger} />
          <InlineMetric label="Year 10 cashflow" value={formatCurrency(businessProjection.yearTen.annualNetCashflow)} color={businessProjection.yearTen.annualNetCashflow >= 0 ? colors.success : colors.warning} />
        </View>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: businessLabels,
              datasets: [
                { data: cumulativeReturn, color: () => colors.success, strokeWidth: 3 },
                { data: cumulativeCash, color: () => colors.warning, strokeWidth: 3 },
                { data: cumulativeBills, color: () => colors.danger, strokeWidth: 3 },
              ],
              legend: ['Total return', 'Cash in', 'Bills'],
            }}
            width={chartWidth}
            height={250}
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
        <Text weight="800">{businessProjection.verdict}</Text>
        <View style={styles.signalList}>
          {businessProjection.signals.map((signal) => (
            <Text key={signal} subtle>
              - {signal}
            </Text>
          ))}
        </View>
      </Panel>

      <SectionHeader title="Operating snapshot" action="Annual summary" />
      <Panel>
        <MetricRow label="Annual rent" value={formatCurrency(annualRent)} />
        <MetricRow label="Annual bills" value={formatCurrency(annualBills)} />
        <MetricRow label="Annual interest" value={formatCurrency(annualInterest)} />
        <MetricRow label="Net operating income" value={formatCurrency(annualNetCashflow)} tone={annualNetCashflow >= 0 ? 'positive' : 'danger'} />
      </Panel>

      <SectionHeader title="Bills & evidence" action={`${billData.bills.length} recorded`} />
      <Panel>
        {billData.bills.map((bill) => (
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
                {bill.bill_type.replace('_', ' ')} - due {bill.due_date} - {bill.recurrence}
              </Text>
            </View>
            <Text weight="800" style={{ color: bill.status === 'paid' ? colors.success : colors.warning }}>
              {formatCurrency(bill.amount)}
            </Text>
            <Pressable onPress={() => deletePropertyBill(bill.id)} style={styles.smallBtn}>
              <Ionicons name="trash-outline" color={colors.danger} size={15} />
            </Pressable>
          </View>
        ))}

        {showBillForm ? (
          <View style={styles.billFormArea}>
            <Text weight="800">Add bill</Text>
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
            <View style={styles.formActions}>
              <Pressable onPress={submitBill} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
                <Text weight="900" style={{ color: colors.background }}>
                  Save bill
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowBillForm(false)}
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setShowBillForm(true)} style={styles.addRow}>
            <Ionicons name="add-circle-outline" color={colors.accentStrong} size={16} />
            <Text weight="800" style={{ color: colors.accentStrong }}>
              Add bill
            </Text>
          </Pressable>
        )}
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

function EditField({
  label,
  value,
  onChangeText,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: { text: string; accent: string; surfaceRaised: string };
}) {
  return (
    <View style={styles.editField}>
      <Text variant="small" subtle weight="800">
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={[styles.textInput, { color: colors.text, borderColor: colors.accent, backgroundColor: colors.surfaceRaised }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  hero: { gap: 16, padding: 20 },
  heroHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  heroCopy: { flex: 1, gap: 4 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 120 },
  ownershipPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  trustRow: { borderTopWidth: StyleSheet.hairlineWidth, gap: 4, paddingTop: 12 },
  detailGrid: { gap: 6 },
  editGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  editField: { flexGrow: 1, gap: 6, minWidth: 180 },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { alignItems: 'center', borderRadius: 8, flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  payoffMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  businessMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  chartWrap: { alignItems: 'flex-start', marginLeft: -18, overflow: 'hidden' },
  chart: { borderRadius: 8 },
  extraRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  textInput: { borderRadius: 8, borderWidth: 1, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  savingsBox: { alignItems: 'flex-start', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  savingsCopy: { flex: 1, gap: 4 },
  signalList: { gap: 6 },
  billRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  checkbox: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 24, justifyContent: 'center', width: 24 },
  billCopy: { flex: 1, gap: 3 },
  smallBtn: { padding: 6 },
  billFormArea: { borderTopColor: '#333', borderTopWidth: StyleSheet.hairlineWidth, gap: 10, marginTop: 12, paddingTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  formActions: { flexDirection: 'row', gap: 8 },
  addRow: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingTop: 8 },
});
