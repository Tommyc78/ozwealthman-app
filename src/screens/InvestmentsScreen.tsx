import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { MetricRow } from '@/components/MetricRow';
import { useAppData } from '@/data/AppDataProvider';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

type HoldingType = 'etf' | 'shares' | 'crypto' | 'bullion' | 'cash' | 'other';

type DraftInvestment = {
  name: string;
  type: HoldingType;
  value: string;
  quantity: string;
  purchasePrice: string;
};

type SellDraft = {
  groupIndex: number;
  holdingIndex: number;
  quantity: string;
  price: string;
};

const EMPTY_DRAFT: DraftInvestment = { name: '', type: 'shares', value: '', quantity: '', purchasePrice: '' };

const TYPE_OPTIONS: { key: HoldingType; label: string; icon: string }[] = [
  { key: 'etf', label: 'ETF', icon: 'trending-up' },
  { key: 'shares', label: 'Shares', icon: 'stats-chart' },
  { key: 'crypto', label: 'Crypto', icon: 'logo-bitcoin' },
  { key: 'bullion', label: 'Bullion', icon: 'diamond-outline' },
  { key: 'cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'other', label: 'Other', icon: 'ellipse-outline' },
];

function getHoldingIcon(type: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('etf') || t.includes('index') || t.includes('vanguard') || t.includes('betashares')) return 'trending-up';
  if (t.includes('share') || t.includes('stock') || t.includes('equity')) return 'stats-chart';
  if (t.includes('crypto') || t.includes('bitcoin') || t.includes('btc') || t.includes('eth') || t.includes('solana')) return 'logo-bitcoin';
  if (t.includes('bullion') || t.includes('gold') || t.includes('silver') || t.includes('metal')) return 'diamond-outline';
  if (t.includes('cash') || t.includes('savings') || t.includes('offset')) return 'cash-outline';
  return 'ellipse-outline';
}

function getHoldingIconByGroup(groupName: string): string {
  const g = (groupName || '').toLowerCase();
  if (g.includes('etf') || g.includes('index')) return 'trending-up';
  if (g.includes('share') || g.includes('stock') || g.includes('equity')) return 'stats-chart';
  if (g.includes('crypto')) return 'logo-bitcoin';
  if (g.includes('bullion') || g.includes('gold') || g.includes('silver')) return 'diamond-outline';
  if (g.includes('cash')) return 'cash-outline';
  return 'ellipse-outline';
}

export function InvestmentsScreen() {
  const { colors, radius, spacing } = useWealthTheme();
  const appData = useAppData();

  const investmentGroups = useMemo(() => {
    const groups: { name: string; icon: string; holdings: any[] }[] = [];

    if (appData.shareHoldings?.length) {
      groups.push({ name: 'Shares & ETFs', icon: 'stats-chart', holdings: appData.shareHoldings.map((h: any) => ({ ...h, _type: h.type || 'shares' })) });
    }
    if (appData.cryptoHoldings?.length) {
      groups.push({ name: 'Crypto', icon: 'logo-bitcoin', holdings: appData.cryptoHoldings.map((h: any) => ({ ...h, _type: 'crypto' })) });
    }
    if (appData.bullionLots?.length) {
      groups.push({ name: 'Bullion', icon: 'diamond-outline', holdings: appData.bullionLots.map((h: any) => ({ ...h, _type: 'bullion' })) });
    }

    if (appData.investmentGroups) {
      return appData.investmentGroups;
    }

    return groups;
  }, [appData]);

  const totalValue = useMemo(() => {
    let total = 0;
    investmentGroups.forEach((group: any) => {
      (group.holdings || []).forEach((h: any) => {
        total += h.value || h.current_value || h.market_value || 0;
      });
    });
    return total;
  }, [investmentGroups]);

  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<DraftInvestment>(EMPTY_DRAFT);
  const [confirmDraft, setConfirmDraft] = useState(false);

  const [sellDraft, setSellDraft] = useState<SellDraft | null>(null);

  const handleAddConfirm = () => {
    if (!draft.name || !draft.value) return;
    appData.addInvestment?.({
      name: draft.name,
      type: draft.type,
      value: Number(draft.value) || 0,
      quantity: Number(draft.quantity) || 0,
      purchase_price: Number(draft.purchasePrice) || 0,
    });
    setDraft(EMPTY_DRAFT);
    setConfirmDraft(false);
    setShowAdd(false);
  };

  const handleSellConfirm = () => {
    if (!sellDraft) return;
    appData.removeInvestment?.({
      groupIndex: sellDraft.groupIndex,
      holdingIndex: sellDraft.holdingIndex,
      quantity: Number(sellDraft.quantity) || 0,
      salePrice: Number(sellDraft.price) || 0,
    });
    setSellDraft(null);
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text variant="small" subtle weight="800">INVESTMENTS</Text>
        <Text variant="title">Investment portfolio</Text>
        <Text subtle>Track your taxable and personal investments. Add new holdings or record a sale.</Text>
      </View>

      <Panel style={{ borderColor: colors.accent }}>
        <Text variant="small" subtle weight="800">TOTAL PERSONAL INVESTMENTS</Text>
        <Text variant="title" style={{ fontSize: 34 }}>{formatCurrency(totalValue)}</Text>
        <Text subtle>Across {investmentGroups.length} categories</Text>
      </Panel>

      <View style={styles.actionRow}>
        <Pressable onPress={() => { setShowAdd(true); setSellDraft(null); }} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
          <Ionicons name="add-circle-outline" color={colors.background} size={18} />
          <Text weight="900" style={{ color: colors.background }}>Add Investment</Text>
        </Pressable>
      </View>

      {showAdd && (
        <Panel>
          {confirmDraft ? (
            <View style={styles.confirmBox}>
              <Text weight="800">Confirm new investment</Text>
              <MetricRow label="Name" value={draft.name} />
              <MetricRow label="Type" value={draft.type} />
              <MetricRow label="Value" value={formatCurrency(Number(draft.value) || 0)} />
              {draft.quantity ? <MetricRow label="Quantity" value={draft.quantity} /> : null}
              {draft.purchasePrice ? <MetricRow label="Purchase Price" value={formatCurrency(Number(draft.purchasePrice) || 0)} /> : null}
              <View style={styles.formActions}>
                <Pressable onPress={handleAddConfirm} style={[styles.formBtn, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" color={colors.background} size={16} />
                  <Text weight="900" style={{ color: colors.background }}>Confirm</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDraft(false)} style={[styles.formBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text weight="900">Back</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.addForm}>
              <Text weight="800">New investment</Text>
              <TextInput
                placeholder="Investment name (e.g. VAS, Bitcoin, Gold bar)"
                placeholderTextColor={colors.muted}
                value={draft.name}
                onChangeText={(v) => setDraft({ ...draft, name: v })}
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
              />
              <Text variant="small" subtle weight="800">TYPE</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable key={opt.key} onPress={() => setDraft({ ...draft, type: opt.key })} style={[styles.typeChip, { backgroundColor: draft.type === opt.key ? colors.accent : colors.surfaceRaised, borderColor: draft.type === opt.key ? colors.accent : colors.border }]}>
                    <Ionicons name={opt.icon as any} color={draft.type === opt.key ? colors.background : colors.muted} size={14} />
                    <Text variant="small" weight="800" style={{ color: draft.type === opt.key ? colors.background : colors.text }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                placeholder="Current value ($)"
                placeholderTextColor={colors.muted}
                value={draft.value}
                onChangeText={(v) => setDraft({ ...draft, value: v })}
                keyboardType="numeric"
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
              />
              <TextInput
                placeholder="Quantity / units (optional)"
                placeholderTextColor={colors.muted}
                value={draft.quantity}
                onChangeText={(v) => setDraft({ ...draft, quantity: v })}
                keyboardType="numeric"
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
              />
              <TextInput
                placeholder="Purchase price per unit (optional)"
                placeholderTextColor={colors.muted}
                value={draft.purchasePrice}
                onChangeText={(v) => setDraft({ ...draft, purchasePrice: v })}
                keyboardType="numeric"
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
              />
              <View style={styles.formActions}>
                <Pressable onPress={() => { if (draft.name && draft.value) setConfirmDraft(true); }} style={[styles.formBtn, { backgroundColor: colors.accent }]}>
                  <Text weight="900" style={{ color: colors.background }}>Review</Text>
                </Pressable>
                <Pressable onPress={() => { setShowAdd(false); setDraft(EMPTY_DRAFT); }} style={[styles.formBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text weight="900">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Panel>
      )}

      {sellDraft && (
        <Panel>
          <Text weight="800">Sell / Dispose</Text>
          <TextInput
            placeholder="Quantity to sell"
            placeholderTextColor={colors.muted}
            value={sellDraft.quantity}
            onChangeText={(v) => setSellDraft({ ...sellDraft, quantity: v })}
            keyboardType="numeric"
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <TextInput
            placeholder="Sale price per unit ($)"
            placeholderTextColor={colors.muted}
            value={sellDraft.price}
            onChangeText={(v) => setSellDraft({ ...sellDraft, price: v })}
            keyboardType="numeric"
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          />
          <View style={styles.formActions}>
            <Pressable onPress={handleSellConfirm} style={[styles.formBtn, { backgroundColor: colors.danger }]}>
              <Ionicons name="remove-circle" color={colors.background} size={16} />
              <Text weight="900" style={{ color: colors.background }}>Confirm Sale</Text>
            </Pressable>
            <Pressable onPress={() => setSellDraft(null)} style={[styles.formBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text weight="900">Cancel</Text>
            </Pressable>
          </View>
        </Panel>
      )}

      <SectionHeader title="Taxable / personal assets" action={`${investmentGroups.reduce((n: number, g: any) => n + (g.holdings?.length || 0), 0)} holdings`} />

      {investmentGroups.map((group: any, gIndex: number) => (
        <Panel key={gIndex}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupIcon, { backgroundColor: colors.surfaceRaised }]}>
              <Ionicons name={(group.icon || getHoldingIconByGroup(group.name)) as any} color={colors.accent} size={20} />
            </View>
            <Text variant="section" style={{ flex: 1 }}>{group.name}</Text>
            <Text subtle>{formatCurrency((group.holdings || []).reduce((s: number, h: any) => s + (h.value || h.current_value || h.market_value || 0), 0))}</Text>
          </View>
          {(group.holdings || []).map((holding: any, hIndex: number) => {
            const holdingValue = holding.value || holding.current_value || holding.market_value || 0;
            const holdingName = holding.name || holding.asset || holding.ticker || 'Unknown';
            const holdingType = holding._type || holding.type || group.name;
            const iconName = getHoldingIcon(holdingType) || getHoldingIcon(holdingName);

            return (
              <View key={hIndex} style={[styles.holdingRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.holdingIcon, { backgroundColor: `${colors.accent}15` }]}>
                  <Ionicons name={iconName as any} color={colors.accent} size={16} />
                </View>
                <View style={styles.holdingCopy}>
                  <Text weight="800">{holdingName}</Text>
                  {holding.quantity ? <Text variant="small" subtle>{holding.quantity} units</Text> : null}
                </View>
                <Text weight="800">{formatCurrency(holdingValue)}</Text>
                <Pressable
                  onPress={() => { setSellDraft({ groupIndex: gIndex, holdingIndex: hIndex, quantity: '', price: '' }); setShowAdd(false); }}
                  style={[styles.sellBtn, { borderColor: colors.danger }]}
                >
                  <Ionicons name="remove-circle-outline" color={colors.danger} size={14} />
                  <Text variant="small" weight="800" style={{ color: colors.danger }}>Sell</Text>
                </Pressable>
              </View>
            );
          })}
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  header: { gap: 4 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addForm: { gap: 10 },
  confirmBox: { gap: 10 },
  textInput: { borderRadius: 8, borderWidth: 1, minHeight: 44, paddingHorizontal: 12, fontSize: 15 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  formBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  holdingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  holdingIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  holdingCopy: { flex: 1, gap: 2 },
  sellBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
});
