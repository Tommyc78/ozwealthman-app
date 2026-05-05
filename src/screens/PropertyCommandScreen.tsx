import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { MetricRow } from '@/components/MetricRow';
import { useAppData } from '@/data/AppDataProvider';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatPercent } from '@/utils/format';

const ASSUMED_RATE = 0.065;
const LOAN_TERM_YEARS = 30;

function EquityBar({ label, equity, debt, total, colors }: { label: string; equity: number; debt: number; total: number; colors: any }) {
  const eqPct = total > 0 ? (equity / total) * 100 : 0;
  return (
    <View style={styles.eqBarRow}>
      <Text weight="800" style={{ width: 140 }} numberOfLines={1}>{label}</Text>
      <View style={styles.eqBarTrack}>
        <View style={[styles.eqBarFillLeft, { width: `${eqPct}%`, backgroundColor: colors.success }]} />
        <View style={[styles.eqBarFillRight, { width: `${100 - eqPct}%`, backgroundColor: colors.danger }]} />
      </View>
      <View style={styles.eqBarLabels}>
        <Text variant="small" style={{ color: colors.success }}>{formatCurrency(equity)}</Text>
        <Text variant="small" style={{ color: colors.danger }}>{formatCurrency(debt)}</Text>
      </View>
    </View>
  );
}

function PayoffRow({ label, loanBalance, monthlyPayment, colors }: { label: string; loanBalance: number; monthlyPayment: number; colors: any }) {
  const monthlyRate = ASSUMED_RATE / 12;
  const monthlyInterest = loanBalance * monthlyRate;
  const monthlyPrincipal = Math.max(monthlyPayment - monthlyInterest, 0);
  const yearsToPayoff = monthlyPrincipal > 0 ? Math.ceil((loanBalance / monthlyPrincipal) / 12) : 99;
  const intPct = monthlyPayment > 0 ? (monthlyInterest / monthlyPayment) * 100 : 0;

  return (
    <View style={[styles.payoffRow, { borderBottomColor: colors.border }]}>
      <Text weight="800" style={{ flex: 1 }}>{label}</Text>
      <View style={styles.payoffMetrics}>
        <View style={styles.payoffMetric}>
          <Text variant="small" subtle>Interest</Text>
          <Text weight="800" style={{ color: colors.warning }}>{formatCurrency(monthlyInterest)}</Text>
        </View>
        <View style={styles.payoffMetric}>
          <Text variant="small" subtle>Principal</Text>
          <Text weight="800" style={{ color: colors.success }}>{formatCurrency(monthlyPrincipal)}</Text>
        </View>
        <View style={styles.payoffMetric}>
          <Text variant="small" subtle>Split</Text>
          <Text weight="800">{Math.round(intPct)}% / {Math.round(100 - intPct)}%</Text>
        </View>
        <View style={styles.payoffMetric}>
          <Text variant="small" subtle>Payoff</Text>
          <Text weight="800" style={{ color: colors.accent }}>~{yearsToPayoff} yrs</Text>
        </View>
      </View>
    </View>
  );
}

export function PropertyCommandScreen() {
  const { colors, radius, spacing } = useWealthTheme();
  const { properties, addBill } = useAppData();

  const [showBillForm, setShowBillForm] = useState(false);
  const [billProperty, setBillProperty] = useState('');
  const [billVendor, setBillVendor] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState('');

  const portfolio = useMemo(() => {
    let totalValue = 0;
    let totalEquity = 0;
    let totalDebt = 0;
    let totalRent = 0;
    (properties || []).forEach((p: any) => {
      const v = p.value || 0;
      const lb = p.loan_balance || 0;
      totalValue += v;
      totalDebt += lb;
      totalEquity += v - lb;
      totalRent += p.rent_monthly || (p.rent_weekly || 0) * 4.33;
    });
    return { totalValue, totalEquity, totalDebt, totalRent, lvr: totalValue > 0 ? (totalDebt / totalValue) * 100 : 0 };
  }, [properties]);

  const handleAddBill = () => {
    if (!billProperty || !billVendor || !billAmount) return;
    addBill?.({
      property: billProperty,
      vendor: billVendor,
      amount: Number(billAmount),
      category: billCategory || 'Other',
      date: new Date().toISOString(),
      status: 'pending',
    });
    setBillVendor('');
    setBillAmount('');
    setBillCategory('');
    setShowBillForm(false);
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text variant="small" subtle weight="800">PROPERTY</Text>
        <Text variant="title">Property dashboard</Text>
        <Text subtle>Track current properties, ownership, bare trust details, debt, rent and bills.</Text>
      </View>

      <Panel style={{ borderColor: colors.accent }}>
        <Text variant="small" subtle weight="800">PORTFOLIO OVERVIEW</Text>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Total Value" value={formatCurrency(portfolio.totalValue)} color={colors.text} />
          <InlineMetric label="Total Equity" value={formatCurrency(portfolio.totalEquity)} color={colors.success} />
          <InlineMetric label="Total Debt" value={formatCurrency(portfolio.totalDebt)} color={colors.danger} />
          <InlineMetric label="LVR" value={`${portfolio.lvr.toFixed(1)}%`} color={portfolio.lvr > 80 ? colors.danger : colors.warning} />
          <InlineMetric label="Monthly Rent" value={formatCurrency(portfolio.totalRent)} color={colors.accent} />
        </View>
      </Panel>

      <SectionHeader title="Equity vs Debt" action="Per property breakdown" />
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
        {(properties || []).map((p: any, i: number) => (
          <EquityBar
            key={i}
            label={p.name}
            equity={(p.value || 0) - (p.loan_balance || 0)}
            debt={p.loan_balance || 0}
            total={p.value || 0}
            colors={colors}
          />
        ))}
      </Panel>

      <SectionHeader title="Interest vs Principal & Payoff" action={`Assumed rate ${(ASSUMED_RATE * 100).toFixed(1)}%`} />
      <Panel>
        {(properties || []).filter((p: any) => (p.loan_balance || 0) > 0).map((p: any, i: number) => {
          const monthlyPayment = p.monthly_repayment || ((p.loan_balance || 0) * (ASSUMED_RATE / 12)) / (1 - Math.pow(1 + ASSUMED_RATE / 12, -LOAN_TERM_YEARS * 12)) || 0;
          return (
            <PayoffRow
              key={i}
              label={p.name}
              loanBalance={p.loan_balance || 0}
              monthlyPayment={monthlyPayment}
              colors={colors}
            />
          );
        })}
        <View style={[styles.payoffSummary, { backgroundColor: colors.surfaceRaised, borderRadius: radius.sm }]}>
          <Ionicons name="information-circle-outline" color={colors.accent} size={18} />
          <Text variant="small" subtle>Payoff estimates assume current repayment amounts at {(ASSUMED_RATE * 100).toFixed(1)}% variable rate. Extra repayments will accelerate payoff.</Text>
        </View>
      </Panel>

      <SectionHeader title="Current properties" action={`${(properties || []).length} properties`} />
      {(properties || []).map((p: any, i: number) => (
        <Pressable key={i} onPress={() => router.push({ pathname: '/(tabs)/property/[id]', params: { id: p.id || String(i) } })}>
          <Panel style={styles.propertyCard}>
            <View style={styles.propertyCardHeader}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text weight="900">{p.name}</Text>
                <Text variant="small" subtle>{p.location}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: p.tag === 'SMSF' ? `${colors.accent}22` : `${colors.success}22` }]}>
                <Text variant="small" weight="800" style={{ color: p.tag === 'SMSF' ? colors.accent : colors.success }}>{p.tag || 'Personal'}</Text>
              </View>
            </View>
            <View style={styles.propertyMetrics}>
              <View style={styles.propertyMetric}>
                <Text variant="small" subtle weight="800">VALUE</Text>
                <Text weight="900">{formatCurrency(p.value)}</Text>
              </View>
              <View style={styles.propertyMetric}>
                <Text variant="small" subtle weight="800">EQUITY</Text>
                <Text weight="900" style={{ color: colors.success }}>{formatCurrency((p.value || 0) - (p.loan_balance || 0))}</Text>
              </View>
              <View style={styles.propertyMetric}>
                <Text variant="small" subtle weight="800">RENT</Text>
                <Text weight="900">{formatCurrency(p.rent_monthly || (p.rent_weekly || 0) * 4.33)}</Text>
              </View>
            </View>
            {p.bare_trust_name ? (
              <View style={[styles.bareTrust, { borderTopColor: colors.border }]}>
                <Text variant="small" subtle weight="800">BARE TRUST</Text>
                <Text variant="small" subtle>{p.bare_trust_name}</Text>
              </View>
            ) : null}
            <View style={styles.drillHint}>
              <Text variant="small" style={{ color: colors.accent }}>View detail & bills</Text>
              <Ionicons name="chevron-forward" color={colors.accent} size={14} />
            </View>
          </Panel>
        </Pressable>
      ))}

      <SectionHeader title="Bill tracker" action="Record and track property bills" />
      {showBillForm ? (
        <Panel>
          <Text weight="800">Add property bill</Text>
          <TextInput
            placeholder="Property name"
            placeholderTextColor={colors.muted}
            value={billProperty}
            onChangeText={setBillProperty}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Vendor / payee"
            placeholderTextColor={colors.muted}
            value={billVendor}
            onChangeText={setBillVendor}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Amount"
            placeholderTextColor={colors.muted}
            value={billAmount}
            onChangeText={setBillAmount}
            keyboardType="numeric"
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Category (e.g. Insurance, Rates, Maintenance)"
            placeholderTextColor={colors.muted}
            value={billCategory}
            onChangeText={setBillCategory}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <View style={styles.formActions}>
            <Pressable onPress={handleAddBill} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
              <Text weight="900" style={{ color: colors.background }}>Save bill</Text>
            </Pressable>
            <Pressable onPress={() => setShowBillForm(false)} style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text weight="900">Cancel</Text>
            </Pressable>
          </View>
        </Panel>
      ) : (
        <PrimaryButton label="+ Add Property Bill" onPress={() => setShowBillForm(true)} />
      )}
    </Screen>
  );
}

function InlineMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.inlineMetric}>
      <Text variant="small" subtle weight="800">{label.toUpperCase()}</Text>
      <Text variant="section" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  header: { gap: 4 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 120 },
  eqLegend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  eqBarRow: { gap: 6, paddingVertical: 8 },
  eqBarTrack: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' },
  eqBarFillLeft: { height: '100%' },
  eqBarFillRight: { height: '100%' },
  eqBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  payoffRow: { gap: 6, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  payoffMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  payoffMetric: { gap: 2 },
  payoffSummary: { flexDirection: 'row', gap: 10, padding: 12, marginTop: 8, alignItems: 'flex-start' },
  propertyCard: { gap: 12 },
  propertyCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  propertyMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  propertyMetric: { gap: 2 },
  bareTrust: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 2 },
  drillHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textInput: { borderRadius: 8, borderWidth: 1, minHeight: 44, paddingHorizontal: 12, fontSize: 15 },
  formActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
});
