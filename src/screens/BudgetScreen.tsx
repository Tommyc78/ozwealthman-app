import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
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
type ImportedTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'kept' | 'deleted' | 'submitted';
  categoryKey: string | null;
};

const DEFAULT_CATEGORIES: BudgetGroup[] = [
  {
    group: 'Housing',
    items: [
      { name: 'Mortgage / Rent', budgeted: 1850, spent: 1850 },
      { name: 'Council Rates & Water', budgeted: 280, spent: 0 },
      { name: 'Home Insurance', budgeted: 110, spent: 110 },
      { name: 'Electricity & Gas', budgeted: 260, spent: 195 },
    ],
  },
  {
    group: 'Transport',
    items: [
      { name: 'Fuel', budgeted: 220, spent: 168 },
      { name: 'Car Rego & Insurance', budgeted: 190, spent: 0 },
      { name: 'Public Transport / Parking', budgeted: 90, spent: 42 },
    ],
  },
  {
    group: 'Living Expenses',
    items: [
      { name: 'Groceries', budgeted: 680, spent: 512 },
      { name: 'Dining Out & Takeaway', budgeted: 260, spent: 188 },
      { name: 'Coffee & Snacks', budgeted: 110, spent: 76 },
    ],
  },
  {
    group: 'Finance & Wealth',
    items: [
      { name: 'Super / Salary Sacrifice', budgeted: 550, spent: 550 },
      { name: 'SMSF Fees', budgeted: 85, spent: 0 },
      { name: 'Investment Property Costs', budgeted: 450, spent: 320 },
      { name: 'Credit Card Repayments', budgeted: 320, spent: 230 },
    ],
  },
  {
    group: 'Lifestyle & Other',
    items: [
      { name: 'Entertainment & Streaming', budgeted: 95, spent: 95 },
      { name: 'Sports / Hobbies', budgeted: 140, spent: 65 },
      { name: 'Tradie Tools / Equipment', budgeted: 120, spent: 0 },
      { name: 'Pet Care', budgeted: 80, spent: 40 },
      { name: 'Gifts & Family', budgeted: 150, spent: 0 },
    ],
  },
];

export function BudgetScreen() {
  const { colors } = useWealthTheme();
  const [budgetData, setBudgetData] = useState<BudgetGroup[]>(DEFAULT_CATEGORIES);
  const [parsedTransactions, setParsedTransactions] = useState<ImportedTransaction[]>([]);
  const [showUploadResult, setShowUploadResult] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [activeCategoryTarget, setActiveCategoryTarget] = useState<string | null>(null);
  const [lastImportSummary, setLastImportSummary] = useState('');
  const [lastRefreshSummary, setLastRefreshSummary] = useState('');

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

  const categoryOptions = useMemo(
    () =>
      budgetData.flatMap((group) =>
        group.items.map((item) => ({
          key: `${group.group}:::${item.name}`,
          label: `${group.group} - ${item.name}`,
        })),
      ),
    [budgetData],
  );

  const importedSummary = useMemo(() => {
    const kept = parsedTransactions.filter((txn) => txn.status === 'kept');
    const deleted = parsedTransactions.filter((txn) => txn.status === 'deleted').length;
    const uncategorized = kept.filter((txn) => !txn.categoryKey).length;
    const total = kept.reduce((sum, txn) => sum + txn.amount, 0);
    return { keptCount: kept.length, deletedCount: deleted, uncategorizedCount: uncategorized, total };
  }, [parsedTransactions]);

  const handleCSVUpload = useCallback(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target?.files?.[0];
      if (!file) {
        return;
      }
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          return;
        }
        const lines = text.split('\n').filter((line) => line.trim());
        const transactions: ImportedTransaction[] = [];
        for (let i = 1; i < lines.length; i += 1) {
          const parts = lines[i].split(',').map((part) => part.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            const amount = Math.abs(parseFloat(parts[2]) || parseFloat(parts[parts.length - 1]) || 0);
            if (amount > 0) {
              transactions.push({
                id: `${parts[0]}-${parts[1]}-${i}`,
                date: parts[0],
                description: parts[1],
                amount,
                status: 'kept',
                categoryKey: null,
              });
            }
          }
        }
        setParsedTransactions(transactions);
        setShowUploadResult(true);
        setActiveCategoryTarget(null);
        setLastImportSummary('');
        setLastRefreshSummary('');
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const addItemToGroup = (groupName: string) => {
    if (!newItemName.trim() || !newItemBudget.trim()) {
      return;
    }
    setBudgetData((current) =>
      current.map((group) =>
        group.group === groupName
          ? {
              ...group,
              items: [...group.items, { name: newItemName.trim(), budgeted: Number(newItemBudget) || 0, spent: 0 }],
            }
          : group,
      ),
    );
    setNewItemName('');
    setNewItemBudget('');
    setAddingTo(null);
  };

  const deleteItem = (groupName: string, itemIndex: number) => {
    setBudgetData((current) =>
      current
        .map((group) =>
          group.group === groupName ? { ...group, items: group.items.filter((_, index) => index !== itemIndex) } : group,
        )
        .filter((group) => group.items.length > 0),
    );
  };

  const updateBudget = (groupName: string, itemIndex: number, newBudget: number) => {
    setBudgetData((current) =>
      current.map((group) =>
        group.group === groupName
          ? {
              ...group,
              items: group.items.map((item, index) => (index === itemIndex ? { ...item, budgeted: newBudget } : item)),
            }
          : group,
      ),
    );
    setEditingItem(null);
    setEditBudget('');
  };

  const addGroup = () => {
    if (!newGroupName.trim()) {
      return;
    }
    setBudgetData((current) => [...current, { group: newGroupName.trim(), items: [] }]);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const setTransactionStatus = (id: string, status: ImportedTransaction['status']) => {
    setParsedTransactions((current) =>
      current.map((txn) =>
        txn.id === id
          ? {
              ...txn,
              status,
              categoryKey: status === 'deleted' ? null : txn.categoryKey,
            }
          : txn,
      ),
    );
    if (status === 'deleted' && activeCategoryTarget === id) {
      setActiveCategoryTarget(null);
    }
  };

  const setTransactionCategory = (id: string, categoryKey: string | null) => {
    setParsedTransactions((current) =>
      current.map((txn) =>
        txn.id === id
          ? {
              ...txn,
              categoryKey,
              status: txn.status === 'deleted' ? 'kept' : txn.status,
            }
          : txn,
      ),
    );
    setActiveCategoryTarget(null);
  };

  const submitImportedTransactions = () => {
    const keptTransactions = parsedTransactions.filter((txn) => txn.status === 'kept');
    if (keptTransactions.length === 0) {
      setLastImportSummary('No kept transactions are waiting to be applied.');
      return;
    }

    const nextBudgetData = budgetData.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item })),
    }));

    const ensureUndefinedGroup = () => {
      let undefinedGroup = nextBudgetData.find((group) => group.group === 'Not yet defined');
      if (!undefinedGroup) {
        undefinedGroup = { group: 'Not yet defined', items: [] };
        nextBudgetData.push(undefinedGroup);
      }
      return undefinedGroup;
    };

    keptTransactions.forEach((txn) => {
      if (txn.categoryKey) {
        const [groupName, itemName] = txn.categoryKey.split(':::');
        const group = nextBudgetData.find((entry) => entry.group === groupName);
        const item = group?.items.find((entry) => entry.name === itemName);
        if (item) {
          item.spent += txn.amount;
          return;
        }
      }

      const undefinedGroup = ensureUndefinedGroup();
      undefinedGroup.items.push({
        name: txn.description,
        budgeted: 0,
        spent: txn.amount,
      });
    });

    setBudgetData(nextBudgetData);
    setParsedTransactions((current) => current.map((txn) => (txn.status === 'kept' ? { ...txn, status: 'submitted' } : txn)));
    setLastImportSummary(
      `${keptTransactions.length} transactions applied. ${keptTransactions.filter((txn) => !txn.categoryKey).length} left as Not yet defined.`,
    );
    setLastRefreshSummary(
      `Budget refreshed with ${formatCurrency(keptTransactions.reduce((sum, txn) => sum + txn.amount, 0))} of imported spend.`,
    );
    setActiveCategoryTarget(null);
  };

  const refreshBudgetTotals = () => {
    setBudgetData((current) => [...current]);
    setLastRefreshSummary(`Budget totals refreshed at ${new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}.`);
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="small" subtle weight="800">
            BUDGET
          </Text>
          <Text variant="title">Monthly Budget</Text>
          <Text subtle>Track budgeted vs actual spending across categories. Upload a bank or credit card CSV and sort the lines properly.</Text>
        </View>
      </View>

      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <Text variant="label" subtle>
          BUDGET OVERVIEW
        </Text>
        <Text variant="title" style={styles.heroValue}>
          {formatCurrency(totals.totalSpent)}
        </Text>
        <Text subtle>spent of {formatCurrency(totals.totalBudgeted)} budgeted</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(totals.percent, 100)}%`,
                  backgroundColor: totals.percent > 90 ? colors.danger : totals.percent > 75 ? colors.warning : colors.success,
                },
              ]}
            />
          </View>
          <Text
            variant="small"
            weight="800"
            style={{ color: totals.percent > 90 ? colors.danger : totals.percent > 75 ? colors.warning : colors.success }}
          >
            {totals.percent}% used
          </Text>
        </View>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Budgeted" value={formatCurrency(totals.totalBudgeted)} color={colors.text} />
          <InlineMetric label="Spent" value={formatCurrency(totals.totalSpent)} color={colors.warning} />
          <InlineMetric label="Remaining" value={formatCurrency(totals.totalBudgeted - totals.totalSpent)} color={colors.success} />
        </View>
      </Panel>

      <SectionHeader title="Bank statement" action="Upload and review" />
      <Panel style={styles.panelGap}>
        <Text subtle>
          Upload a bank or credit card CSV statement. New transactions land in Not yet defined until you keep, delete or map them to the right budget category.
        </Text>
        <PrimaryButton label="Upload Bank / Credit Card Statement (CSV)" onPress={handleCSVUpload} />
        {showUploadResult ? (
          <View style={styles.panelGap}>
            <View style={[styles.uploadBadge, { backgroundColor: colors.surfaceRaised, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" color={colors.success} size={18} />
              <Text weight="800" style={{ color: colors.success }}>
                {uploadFileName} - {parsedTransactions.length} transactions parsed
              </Text>
            </View>

            <View style={styles.importSummaryGrid}>
              <InlineMetric label="Keep" value={String(importedSummary.keptCount)} color={colors.success} />
              <InlineMetric label="Delete" value={String(importedSummary.deletedCount)} color={colors.danger} />
              <InlineMetric label="Not defined" value={String(importedSummary.uncategorizedCount)} color={colors.warning} />
              <InlineMetric label="Spend" value={formatCurrency(importedSummary.total)} color={colors.text} />
            </View>

            {lastImportSummary ? (
              <Text variant="small" style={{ color: colors.success }}>
                {lastImportSummary}
              </Text>
            ) : null}
            {lastRefreshSummary ? (
              <Text variant="small" subtle>
                {lastRefreshSummary}
              </Text>
            ) : null}

            {parsedTransactions.slice(0, 30).map((txn) => {
              const categoryLabel = categoryOptions.find((option) => option.key === txn.categoryKey)?.label ?? 'Not yet defined';
              const isDeleted = txn.status === 'deleted';
              const isSubmitted = txn.status === 'submitted';
              return (
                <View
                  key={txn.id}
                  style={[
                    styles.importCard,
                    {
                      borderColor: isDeleted ? colors.danger : isSubmitted ? colors.success : colors.border,
                      backgroundColor: isDeleted ? `${colors.danger}10` : colors.surfaceRaised,
                    },
                  ]}
                >
                  <View style={styles.txnRow}>
                    <View style={styles.txnCopy}>
                      <Text weight="800">{txn.description}</Text>
                      <Text variant="small" subtle>
                        {txn.date}
                      </Text>
                    </View>
                    <Text weight="800" style={{ color: isDeleted ? colors.muted : colors.warning }}>
                      {formatCurrency(txn.amount)}
                    </Text>
                  </View>

                  <View style={styles.importMetaRow}>
                    <Text variant="small" subtle>
                      Category
                    </Text>
                    <Text
                      variant="small"
                      weight="800"
                      style={{ color: txn.categoryKey ? colors.success : colors.warning, flex: 1, textAlign: 'right' }}
                      numberOfLines={1}
                    >
                      {categoryLabel}
                    </Text>
                  </View>

                  <View style={styles.importActionRow}>
                    <Pressable
                      onPress={() => setTransactionStatus(txn.id, 'kept')}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: !isDeleted ? `${colors.success}22` : colors.surface,
                          borderColor: !isDeleted ? colors.success : colors.border,
                        },
                      ]}
                    >
                      <Text weight="800" style={{ color: !isDeleted ? colors.success : colors.text }}>
                        Keep
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setTransactionStatus(txn.id, 'deleted')}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isDeleted ? `${colors.danger}22` : colors.surface,
                          borderColor: isDeleted ? colors.danger : colors.border,
                        },
                      ]}
                    >
                      <Text weight="800" style={{ color: isDeleted ? colors.danger : colors.text }}>
                        Delete
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setActiveCategoryTarget(activeCategoryTarget === txn.id ? null : txn.id)}
                      style={[styles.statusChip, { backgroundColor: colors.surface, borderColor: colors.accent }]}
                    >
                      <Text weight="800" style={{ color: colors.accentStrong }}>
                        {txn.categoryKey ? 'Change category' : 'Assign category'}
                      </Text>
                    </Pressable>
                  </View>

                  {activeCategoryTarget === txn.id ? (
                    <View style={styles.categoryChooser}>
                      <Pressable
                        onPress={() => setTransactionCategory(txn.id, null)}
                        style={[styles.categoryChip, { backgroundColor: `${colors.warning}18`, borderColor: colors.warning }]}
                      >
                        <Text weight="800" style={{ color: colors.warning }}>
                          Not yet defined
                        </Text>
                      </Pressable>
                      {categoryOptions.map((option) => (
                        <Pressable
                          key={option.key}
                          onPress={() => setTransactionCategory(txn.id, option.key)}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: txn.categoryKey === option.key ? `${colors.success}18` : colors.surface,
                              borderColor: txn.categoryKey === option.key ? colors.success : colors.border,
                            },
                          ]}
                        >
                          <Text
                            variant="small"
                            weight="800"
                            style={{ color: txn.categoryKey === option.key ? colors.success : colors.text }}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}

            {parsedTransactions.length > 30 ? (
              <Text subtle variant="small">
                Showing first 30 of {parsedTransactions.length} transactions.
              </Text>
            ) : null}

            <View style={styles.importButtons}>
              <PrimaryButton label="Submit imported transactions" onPress={submitImportedTransactions} />
              <PrimaryButton label="Refresh budget totals" onPress={refreshBudgetTotals} variant="secondary" />
            </View>
          </View>
        ) : null}
      </Panel>

      <SectionHeader title="Manual transactions" action="Keep entering exceptions" />
      <Panel>
        <Text subtle>
          Manual entry still matters. Use it for cash, odd reimbursements, or anything the statement import did not capture cleanly.
        </Text>
      </Panel>

      <SectionHeader title="Budget categories" action="Tap amount to edit" />
      {budgetData.map((group) => {
        const groupTotal = group.items.reduce((sum, item) => sum + item.budgeted, 0);
        const groupSpent = group.items.reduce((sum, item) => sum + item.spent, 0);

        return (
          <Panel key={group.group}>
            <View style={styles.groupHeader}>
              <Text variant="section">{group.group}</Text>
              <Text variant="small" subtle>
                {formatCurrency(groupSpent)} / {formatCurrency(groupTotal)}
              </Text>
            </View>
            {group.items.map((item, itemIndex) => (
              <View key={itemIndex} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.itemCopy}>
                  <Text weight="800">{item.name}</Text>
                  <View style={[styles.miniBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.miniBarFill,
                        {
                          width: `${item.budgeted > 0 ? Math.min((item.spent / item.budgeted) * 100, 100) : 0}%`,
                          backgroundColor: item.spent > item.budgeted ? colors.danger : colors.success,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.itemValues}>
                  {editingItem?.group === group.group && editingItem?.index === itemIndex ? (
                    <View style={styles.editRow}>
                      <TextInput
                        value={editBudget}
                        onChangeText={setEditBudget}
                        keyboardType="numeric"
                        style={[styles.editInput, { color: colors.text, borderColor: colors.accent, backgroundColor: colors.surfaceRaised }]}
                        autoFocus
                      />
                      <Pressable
                        onPress={() => updateBudget(group.group, itemIndex, Number(editBudget) || 0)}
                        style={[styles.tinyButton, { backgroundColor: colors.success }]}
                      >
                        <Ionicons name="checkmark" color={colors.background} size={14} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setEditingItem({ group: group.group, index: itemIndex });
                        setEditBudget(String(item.budgeted));
                      }}
                    >
                      <Text weight="800">{formatCurrency(item.budgeted)}</Text>
                    </Pressable>
                  )}
                  <Text variant="small" subtle>
                    {formatCurrency(item.spent)} spent
                  </Text>
                </View>
                <Pressable onPress={() => deleteItem(group.group, itemIndex)} style={styles.deleteButton}>
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
                    <Text weight="900" style={{ color: colors.background }}>
                      Add
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAddingTo(null)}
                    style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <Text weight="900">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setAddingTo(group.group)} style={styles.addItemButton}>
                <Ionicons name="add-circle-outline" color={colors.accentStrong} size={16} />
                <Text weight="800" style={{ color: colors.accentStrong }}>
                  Add item
                </Text>
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
              <Text weight="900" style={{ color: colors.background }}>
                Create
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowAddGroup(false)}
              style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            >
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
  header: { gap: 4 },
  headerCopy: { gap: 4 },
  hero: { gap: 12, padding: 20 },
  heroValue: { fontSize: 34 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inlineMetric: { flex: 1, gap: 4, minWidth: 130 },
  panelGap: { gap: 10 },
  barContainer: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  barBackground: { borderRadius: 4, flex: 1, height: 8, overflow: 'hidden' },
  barFill: { borderRadius: 4, height: '100%' },
  importSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  uploadBadge: { alignItems: 'center', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 12 },
  importCard: { borderRadius: 8, borderWidth: 1, gap: 10, padding: 12 },
  txnRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  txnCopy: { flex: 1, gap: 2 },
  importMetaRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  importActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  categoryChooser: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  importButtons: { gap: 10 },
  groupHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  itemRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  itemCopy: { flex: 1, gap: 4 },
  itemValues: { alignItems: 'flex-end', gap: 2 },
  miniBar: { borderRadius: 2, height: 4, overflow: 'hidden', width: 120 },
  miniBarFill: { borderRadius: 2, height: '100%' },
  deleteButton: { padding: 6 },
  editRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  editInput: { borderRadius: 6, borderWidth: 1, fontWeight: '800', height: 32, paddingHorizontal: 8, textAlign: 'right', width: 80 },
  tinyButton: { alignItems: 'center', borderRadius: 6, height: 28, justifyContent: 'center', padding: 4, width: 28 },
  addForm: { gap: 8, paddingTop: 8 },
  textInput: { borderRadius: 8, borderWidth: 1, fontSize: 15, minHeight: 44, paddingHorizontal: 12 },
  addActions: { flexDirection: 'row', gap: 8 },
  smallAction: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addItemButton: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingTop: 8 },
  addGroupButton: { alignItems: 'center', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, padding: 20 },
});
