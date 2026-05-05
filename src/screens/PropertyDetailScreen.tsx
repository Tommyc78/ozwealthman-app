import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { MetricRow } from '@/components/MetricRow';
import { useAppData } from '@/data/AppDataProvider';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatPercent, formatDate } from '@/utils/format';

type Bill = { vendor: string; amount: number; category: string; status: string; date: string };

export function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, radius, spacing } = useWealthTheme();
  const { properties, updateProperty } = useAppData();

  const property = useMemo(() => {
    if (!properties) return null;
    return properties.find((p: any) => (p.id || '') === id) || properties[Number(id)] || null;
  }, [properties, id]);

  const [showAddBill, setShowAddBill] = useState(false);
  const [editingBillIndex, setEditingBillIndex] = useState<number | null>(null);
  const [billVendor, setBillVendor] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState('');
  const [billStatus, setBillStatus] = useState('pending');

  if (!property) {
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

  const value = property.value || 0;
  const loanBalance = property.loan_balance || 0;
  const equity = value - loanBalance;
  const debtRatio = value > 0 ? (loanBalance / value) * 100 : 0;
  const rentMonthly = property.rent_monthly || (property.rent_weekly || 0) * 4.33;
  const grossYield = value > 0 ? ((rentMonthly * 12) / value) * 100 : 0;
  const bills: Bill[] = property.bills || [];
  const annualRent = rentMonthly * 12;
  const annualExpenses = bills.reduce((sum: number, b: Bill) => sum + (b.amount || 0), 0);
  const netOperating = annualRent - annualExpenses;

  const startEditBill = (index: number) => {
    const bill = bills[index];
    setBillVendor(bill.vendor);
    setBillAmount(String(bill.amount));
    setBillCategory(bill.category || '');
    setBillStatus(bill.status || 'pending');
    setEditingBillIndex(index);
    setShowAddBill(false);
  };

  const saveBill = () => {
    if (!billVendor || !billAmount) return;
    const newBill: Bill = {
      vendor: billVendor,
      amount: Number(billAmount) || 0,
      category: billCategory || 'Other',
      status: billStatus,
      date: new Date().toISOString(),
    };
    const updatedBills = [...bills];
    if (editingBillIndex !== null) {
      updatedBills[editingBillIndex] = { ...bills[editingBillIndex], ...newBill, date: bills[editingBillIndex].date };
    } else {
      updatedBills.push(newBill);
    }
    updateProperty?.({ ...property, bills: updatedBills });
    resetForm();
  };

  const deleteBill = (index: number) => {
    const updatedBills = bills.filter((_: Bill, i: number) => i !== index);
    updateProperty?.({ ...property, bills: updatedBills });
  };

  const resetForm = () => {
    setBillVendor('');
    setBillAmount('');
    setBillCategory('');
    setBillStatus('pending');
    setEditingBillIndex(null);
    setShowAddBill(false);
  };

  const billIcon = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('insurance')) return 'shield-checkmark-outline';
    if (c.includes('rate') || c.includes('council')) return 'business-outline';
    if (c.includes('water') || c.includes('electric') || c.includes('gas')) return 'flash-outline';
    if (c.includes('maintenance') || c.includes('repair')) return 'construct-outline';
    if (c.includes('management')) return 'people-outline';
    return 'receipt-outline';
  };

  const statusColor = (s: string) => {
    if (s === 'paid') return colors.success;
    if (s === 'overdue') return colors.danger;
    return colors.warning;
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.accent} size={18} />
        <Text weight="800" style={{ color: colors.accent }}>Properties</Text>
      </Pressable>

      <Panel style={{ borderColor: colors.accent }}>
        <View style={styles.heroHeader}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{property.name}</Text>
            <Text subtle>{property.location}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: property.tag === 'SMSF' ? `${colors.accent}22` : `${colors.success}22` }]}>
            <Text variant="small" weight="800" style={{ color: property.tag === 'SMSF' ? colors.accent : colors.success }}>{property.tag || 'Personal'}</Text>
          </View>
        </View>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Value" value={formatCurrency(value)} color={colors.text} />
          <InlineMetric label="Equity" value={formatCurrency(equity)} color={colors.success} />
          <InlineMetric label="Debt Ratio" value={`${debtRatio.toFixed(1)}%`} color={debtRatio > 80 ? colors.danger : colors.warning} />
          <InlineMetric label="Gross Yield" value={`${grossYield.toFixed(1)}%`} color={colors.accent} />
        </View>
        {property.ownership && (
          <MetricRow label="Ownership" value={property.ownership} />
        )}
        {property.bare_trust_name && (
          <MetricRow label="Bare Trust" value={property.bare_trust_name} />
        )}
      </Panel>

      <SectionHeader title="Bills & evidence" action={`${bills.length} recorded`} />
      <Panel>
        {bills.length === 0 ? (
          <Text subtle>No bills recorded yet. Add your first property bill below.</Text>
        ) : (
          bills.map((bill: Bill, index: number) => (
            <View key={index} style={[styles.billRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.billIcon, { backgroundColor: colors.surfaceRaised }]}>
                <Ionicons name={billIcon(bill.category)} color={colors.accent} size={18} />
              </View>
              <View style={styles.billCopy}>
                <Text weight="800">{bill.vendor}</Text>
                <Text variant="small" subtle>{bill.category || 'Uncategorised'} &middot; {bill.date ? formatDate(bill.date) : 'No date'}</Text>
              </View>
              <View style={styles.billRight}>
                <Text weight="800">{formatCurrency(bill.amount)}</Text>
                <Text variant="small" weight="800" style={{ color: statusColor(bill.status) }}>{bill.status}</Text>
              </View>
              <View style={styles.billActions}>
                <Pressable onPress={() => startEditBill(index)} style={styles.smallBtn}>
                  <Ionicons name="pencil-outline" color={colors.accent} size={15} />
                </Pressable>
                <Pressable onPress={() => deleteBill(index)} style={styles.smallBtn}>
                  <Ionicons name="trash-outline" color={colors.danger} size={15} />
                </Pressable>
              </View>
            </View>
          ))
        )}
        {(showAddBill || editingBillIndex !== null) ? (
          <View style={styles.billForm}>
            <Text weight="800">{editingBillIndex !== null ? 'Edit bill' : 'Add bill'}</Text>
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
              placeholder="Category (Insurance, Rates, Maintenance, etc.)"
              placeholderTextColor={colors.muted}
              value={billCategory}
              onChangeText={setBillCategory}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
            <View style={styles.statusRow}>
              <Text variant="small" subtle>Status:</Text>
              {['pending', 'paid', 'overdue'].map((s) => (
                <Pressable key={s} onPress={() => setBillStatus(s)} style={[styles.statusChip, { backgroundColor: billStatus === s ? statusColor(s) : colors.surfaceRaised, borderColor: statusColor(s) }]}>
                  <Text variant="small" weight="800" style={{ color: billStatus === s ? colors.background : statusColor(s) }}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formActions}>
              <Pressable onPress={saveBill} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
                <Text weight="900" style={{ color: colors.background }}>Save</Text>
              </Pressable>
              <Pressable onPress={resetForm} style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setShowAddBill(true)} style={styles.addRow}>
            <Ionicons name="add-circle-outline" color={colors.accentStrong} size={16} />
            <Text weight="800" style={{ color: colors.accentStrong }}>Add bill</Text>
          </Pressable>
        )}
      </Panel>

      <SectionHeader title="Operating expenses" action="Annual summary" />
      <Panel>
        <MetricRow label="Annual Rent" value={formatCurrency(annualRent)} />
        <MetricRow label="Annual Expenses (bills)" value={formatCurrency(annualExpenses)} />
        <MetricRow label="Net Operating Income" value={formatCurrency(netOperating)} valueColor={netOperating >= 0 ? colors.success : colors.danger} />
        {rentMonthly > 0 && (
          <MetricRow label="Expense Ratio" value={`${((annualExpenses / annualRent) * 100).toFixed(1)}%`} />
        )}
      </Panel>
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
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 120 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  billIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  billCopy: { flex: 1, gap: 2 },
  billRight: { alignItems: 'flex-end', gap: 2 },
  billActions: { flexDirection: 'row', gap: 4 },
  smallBtn: { padding: 6 },
  billForm: { gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
  textInput: { borderRadius: 8, borderWidth: 1, minHeight: 44, paddingHorizontal: 12, fontSize: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  formActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
});
