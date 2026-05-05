import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

type BudgetItem = { name: string; budgeted: number; spent: number };
type BudgetGroup = { group: string; items: BudgetItem[] };
type ParsedTransaction = { date: string; description: string; amount: number };

const DEFAULT_CATEGORIES: BudgetGroup[] = [
  { group: 'Housing', items: [
    { name: 'Mortgage / Rent', budgeted: 1850, spent: 1850 },
    { name: 'Council Rates & Water', budgeted: 280, spent: 0 },
    { name: 'Home Insurance', budgeted: 110, spent: 110 },
    { name: 'Electricity & Gas', budgeted: 260, spent: 195 },
  ]},
  { group: 'Transport', items: [
    { name: 'Fuel', budgeted: 220, spent: 168 },
    { name: 'Car Rego & Insurance', budgeted: 190, spent: 0 },
    { name: 'Public Transport / Parking', budgeted: 90, spent: 42 },
  ]},
  { group: 'Living Expenses', items: [
    { name: 'Groceries', budgeted: 680, spent: 512 },
    { name: 'Dining Out & Takeaway', budgeted: 260, spent: 188 },
    { name: 'Coffee & Snacks', budgeted: 110, spent: 76 },
  ]},
  { group: 'Finance & Wealth', items: [
    { name: 'Super / Salary Sacrifice', budgeted: 550, spent: 550 },
    { name: 'SMSF Fees', budgeted: 85, spent: 0 },
    { name: 'Investment Property Costs', budgeted: 450, spent: 320 },
    { name: 'Credit Card Repayments', budgeted: 320, spent: 230 },
  ]},
  { group: 'Lifestyle & Other', items: [
    { name: 'Entertainment & Streaming', budgeted: 95, spent: 95 },
    { name: 'Sports / Hobbies', budgeted: 140, spent: 65 },
    { name: 'Tradie Tools / Equipment', budgeted: 120, spent: 0 },
    { name: 'Pet Care', budgeted: 80, spent: 40 },
    { name: 'Gifts & Family', budgeted: 150, spent: 0 },
  ]},
];

export function BudgetScreen() {
  const { colors, radius, spacing } = useWealthTheme();
  const [budgetData, setBudgetData] = useState<BudgetGroup[]>(DEFAULT_CATEGORIES);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [showUploadResult, setShowUploadResult] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBudget, setNewItemBudget] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [editingItem, setEditingItem] = useState<{ group: string; index: number } | null>(null);
  const [editBudget, setEditBudget] = useState('');

  const totals = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    budgetData.forEach((group) => {
      group.items.forEach((item) => {
        totalBudgeted += item.budgeted;
        totalSpent += item.spent;
      });
    });
    const percent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
    return { totalBudgeted, totalSpent, percent };
  }, [budgetData]);

  const handleCSVUpload = useCallback(() => {
    if (Platform.OS !== 'web') { return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target?.files?.[0];
      if (!file) { return; }
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) { return; }
        const lines = text.split('\n').filter((line) => line.trim());
        const transactions: ParsedTransaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            const amount = Math.abs(parseFloat(parts[2]) || parseFloat(parts[parts.length - 1]) || 0);
            if (amount > 0) {
              transactions.push({ date: parts[0], description: parts[1], amount });
            }
          }
        }
        setParsedTransactions(transactions);
        setShowUploadResult(true);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const addItemToGroup = (groupName: string) => {
    if (!newItemName.trim() || !newItemBudget.trim()) { return; }
    setBudgetData((current) =>
      current.map((group) =>
        group.group === groupName
          ? { ...group, items: [...group.items, { name: newItemName.trim(), budgeted: Number(newItemBudget) || 0, spent: 0 }] }
          : group,
      ),
    );
    setNewItemName('');
    setNewItemBudget('');
    setAddingTo(null);
  };

  const deleteItem = (groupName: string, itemIndex: number) => {
    setBudgetData((current) =>
      current.map((group) =>
        group.group === groupName
          ? { ...group, items: group.items.filter((_, index) => index !== itemIndex) }
          : group,
      ).filter((group) => group.items.length > 0),
    );
  };

  const updateBudget = (groupName: string, itemIndex: number, newBudget: number) => {
    setBudgetData((current) =>
      current.map((group) =>
        group.group === groupName
          ? { ...group, items: group.items.map((item, index) => index === itemIndex ? { ...item, budgeted: newBudget } : item) }
          : group,
      ),
    );
    setEditingItem(null);
    setEditBudget('');
  };

  const addGroup = () => {
    if (!newGroupName.trim()) { return; }
    setBudgetData((current) => [...current, { group: newGroupName.trim(), items: [] }]);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="small" subtle weight="800">BUDGET</Text>
          <Text variant="title">Monthly Budget</Text>
          <Text subtle>Track budgeted vs actual spending across categories. Upload a bank statement CSV to auto-populate.</Text>
        </View>
      </View>

      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <Text variant="label" subtle>BUDGET OVERVIEW</Text>
        <Text variant="title" style={styles.heroValue}>{formatCurrency(totals.totalSpent)}</Text>
        <Text subtle>spent of {formatCurrency(totals.totalBudgeted)} budgeted</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${Math.min(totals.percent, 100)}%`, backgroundColor: totals.percent > 90 ? colors.danger : totals.percent > 75 ? colors.warning : colors.success }]} />
          </View>
          <Text variant="small" weight="800" style={{ color: totals.percent > 90 ? colors.danger : colors.success }}>
            {totals.percent}% used
          </Text>
        </View>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Budgeted" value={formatCurrency(totals.totalBudgeted)} color={colors.text} />
          <InlineMetric label="Spent" value={formatCurrency(totals.totalSpent)} color={colors.warning} />
          <InlineMetric label="Remaining" value={formatCurrency(totals.totalBudgeted - totals.totalSpent)} color={colors.success} />
        </View>
      </Panel>

      <SectionHeader title="Bank statement" action="Upload CSV to analyse" />
      <Panel>
        <Text subtle>Upload a bank or credit card CSV statement. The system will parse transactions and display them below for review.</Text>
        <PrimaryButton label="Upload Bank / Credit Card Statement (CSV)" onPress={handleCSVUpload} />
        {showUploadResult && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <View style={[styles.uploadBadge, { backgroundColor: colors.surfaceRaised, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" color={colors.success} size={18} />
              <Text weight="800" style={{ color: colors.success }}>{uploadFileName} — {parsedTransactions.length} transactions parsed</Text>
            </View>
            {parsedTransactions.slice(0, 20).map((txn, index) => (
              <View key={index} style={[styles.txnRow, { borderBottomColor: colors.border }]}>
                <View style={styles.txnCopy}>
                  <Text weight="800">{txn.description}</Text>
                  <Text variant="small" subtle>{txn.date}</Text>
                </View>
                <Text weight="800" style={{ color: colors.warning }}>{formatCurrency(txn.amount)}</Text>
              </View>
            ))}
            {parsedTransactions.length > 20 && (
              <Text subtle variant="small">Showing first 20 of {parsedTransactions.length} transactions.</Text>
            )}
          </View>
        )}
      </Panel>

      <SectionHeader title="Budget categories" action="Tap amount to edit" />
      {budgetData.map((group) => {
        const groupTotal = group.items.reduce((sum, item) => sum + item.budgeted, 0);
        const groupSpent = group.items.reduce((sum, item) => sum + item.spent, 0);

        return (
          <Panel key={group.group}>
            <View style={styles.groupHeader}>
              <Text variant="section">{group.group}</Text>
              <Text variant="small" subtle>{formatCurrency(groupSpent)} / {formatCurrency(groupTotal)}</Text>
            </View>
            {group.items.map((item, iIndex) => (
              <View key={iIndex} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.itemCopy}>
                  <Text weight="800">{item.name}</Text>
                  <View style={[styles.miniBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.miniBarFill, {
                      width: `${item.budgeted > 0 ? Math.min((item.spent / item.budgeted) * 100, 100) : 0}%`,
                      backgroundColor: item.spent > item.budgeted ? colors.danger : colors.success,
                    }]} />
                  </View>
                </View>
                <View style={styles.itemValues}>
                  {editingItem?.group === group.group && editingItem?.index === iIndex ? (
                    <View style={styles.editRow}>
                      <TextInput
                        value={editBudget}
                        onChangeText={setEditBudget}
                        keyboardType="numeric"
                        style={[styles.editInput, { color: colors.text, borderColor: colors.accent, backgroundColor: colors.surfaceRaised }]}
                        autoFocus
                      />
                      <Pressable onPress={() => updateBudget(group.group, iIndex, Number(editBudget) || 0)} style={[styles.tinyButton, { backgroundColor: colors.success }]}>
                        <Ionicons name="checkmark" color={colors.background} size={14} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => { setEditingItem({ group: group.group, index: iIndex }); setEditBudget(String(item.budgeted)); }}>
                      <Text weight="800">{formatCurrency(item.budgeted)}</Text>
                    </Pressable>
                  )}
                  <Text variant="small" subtle>{formatCurrency(item.spent)} spent</Text>
                </View>
                <Pressable onPress={() => deleteItem(group.group, iIndex)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" color={colors.danger} size={16} />
                </Pressable>
              </View>
            ))}
            {addingTo === group.group ? (
              <View style={styles.addForm}>
                <TextInput
                  placeholder="Item name"
                  placeholderTextColor={colors.muted}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
                />
                <TextInput
                  placeholder="Budget amount"
                  placeholderTextColor={colors.muted}
                  value={newItemBudget}
                  onChangeText={setNewItemBudget}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
                />
                <View style={styles.addActions}>
                  <Pressable onPress={() => addItemToGroup(group.group)} style={[styles.smallAction, { backgroundColor: colors.success }]}>
                    <Text weight="900" style={{ color: colors.background }}>Add</Text>
                  </Pressable>
                  <Pressable onPress={() => setAddingTo(null)} style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text weight="900">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setAddingTo(group.group)} style={styles.addItemButton}>
                <Ionicons name="add-circle-outline" color={colors.accentStrong} size={16} />
                <Text weight="800" style={{ color: colors.accentStrong }}>Add item</Text>
              </Pressable>
            )}
          </Panel>
        );
      })}

      {showAddGroup ? (
        <Panel>
          <Text weight="800">New category group</Text>
          <TextInput
            placeholder="e.g. Health & Medical"
            placeholderTextColor={colors.muted}
            value={newGroupName}
            onChangeText={setNewGroupName}
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <View style={styles.addActions}>
            <Pressable onPress={addGroup} style={[styles.smallAction, { backgroundColor: colors.success }]}>
              <Text weight="900" style={{ color: colors.background }}>Create</Text>
            </Pressable>
            <Pressable onPress={() => setShowAddGroup(false)} style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text weight="900">Cancel</Text>
            </Pressable>
          </View>
        </Panel>
      ) : (
        <Pressable onPress={() => setShowAddGroup(true)} style={[styles.addGroupButton, { borderColor: colors.accent }]}>
          <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>+ Add Custom Category</Text>
        </Pressable>
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
  headerCopy: { gap: 4 },
  hero: { gap: 12, padding: 20 },
  heroValue: { fontSize: 34 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 130 },
  barContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barBackground: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  itemCopy: { flex: 1, gap: 4 },
  itemValues: { alignItems: 'flex-end', gap: 2 },
  miniBar: { height: 4, borderRadius: 2, overflow: 'hidden', width: 120 },
  miniBarFill: { height: '100%', borderRadius: 2 },
  deleteButton: { padding: 6 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editInput: { borderRadius: 6, borderWidth: 1, width: 80, height: 32, paddingHorizontal: 8, textAlign: 'right', fontWeight: '800' },
  tinyButton: { borderRadius: 6, padding: 4, height: 28, width: 28, alignItems: 'center', justifyContent: 'center' },
  addForm: { gap: 8, paddingTop: 8 },
  textInput: { borderRadius: 8, borderWidth: 1, minHeight: 44, paddingHorizontal: 12, fontSize: 15 },
  addActions: { flexDirection: 'row', gap: 8 },
  smallAction: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addItemButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  addGroupButton: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 20, alignItems: 'center' },
  uploadBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, padding: 12 },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  txnCopy: { flex: 1, gap: 2 },
});
