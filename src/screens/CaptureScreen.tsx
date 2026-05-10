import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

type CaptureMode = 'investment' | 'property_bill' | 'smsf' | 'super';

const modeCopy: Record<CaptureMode, { title: string; helper: string; icon: keyof typeof Ionicons.glyphMap }> = {
  investment: {
    title: 'Personal investment',
    helper: 'ETF, crypto, bullion, dividend or another taxable investment entry.',
    icon: 'pie-chart-outline',
  },
  property_bill: {
    title: 'Property bill',
    helper: 'Rates, water, insurance, body corporate, repairs or a one-off property cost.',
    icon: 'home-outline',
  },
  smsf: {
    title: 'SMSF movement',
    helper: 'Contribution, ETF units, crypto, metal lot, cash movement or a property expense.',
    icon: 'business-outline',
  },
  super: {
    title: 'Super settings',
    helper: 'Salary sacrifice, TPD or income protection assumptions for projection work.',
    icon: 'trending-up-outline',
  },
};

export function CaptureScreen() {
  const { colors } = useWealthTheme();
  const { data, superSettings, confirmInvestmentItem, confirmSMSFLedgerItem, addPropertyBill, updateSuper, refreshDashboard } = useAppData();
  const [mode, setMode] = useState<CaptureMode>('investment');
  const [message, setMessage] = useState('Quick capture ready. Save an item here, then move back into the dashboard or AI coach.');
  const [investmentForm, setInvestmentForm] = useState({
    type: 'ETF purchase',
    account: 'Personal',
    label: 'IVV',
    quantity: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [billForm, setBillForm] = useState({
    property_id: data.propertyHoldings[0]?.id ?? '',
    bill_type: 'water',
    vendor: '',
    amount: '',
    due_date: new Date().toISOString().slice(0, 10),
  });
  const [smsfForm, setSmsfForm] = useState({
    type: 'Contribution',
    label: 'Employer contribution',
    quantity: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [superForm, setSuperForm] = useState({
    salary_sacrifice: String(superSettings.salary_sacrifice),
    tpd_premium: String(superSettings.tpd_premium),
    ip_premium: String(superSettings.ip_premium),
  });

  const saveInvestment = () => {
    confirmInvestmentItem(investmentForm);
    refreshDashboard();
    setMessage(`Saved ${investmentForm.type.toLowerCase()} for ${investmentForm.label}. Dashboard totals refreshed.`);
    setInvestmentForm((current) => ({ ...current, quantity: '', amount: '' }));
  };

  const savePropertyBill = () => {
    const amount = Number(billForm.amount);
    if (!billForm.vendor.trim() || amount <= 0) {
      return;
    }
    addPropertyBill({
      property_id: billForm.property_id,
      bill_type: billForm.bill_type as 'water' | 'rates' | 'body_corporate' | 'insurance' | 'utilities' | 'repairs' | 'loan' | 'other',
      vendor: billForm.vendor.trim(),
      amount,
      due_date: billForm.due_date,
      paid_date: undefined,
      recurrence: 'once',
      status: 'upcoming',
      notes: 'Captured from mobile quick entry',
    });
    refreshDashboard();
    setMessage(`Saved ${billForm.vendor} for ${formatCurrency(amount)} to the property bill tracker.`);
    setBillForm((current) => ({ ...current, vendor: '', amount: '' }));
  };

  const saveSMSF = () => {
    confirmSMSFLedgerItem(smsfForm);
    refreshDashboard();
    setMessage(`Saved SMSF ${smsfForm.type.toLowerCase()} entry for ${smsfForm.label}.`);
    setSmsfForm((current) => ({ ...current, quantity: '', amount: '' }));
  };

  const saveSuperSettings = () => {
    updateSuper({
      salary_sacrifice: Number(superForm.salary_sacrifice) || 0,
      tpd_premium: Number(superForm.tpd_premium) || 0,
      ip_premium: Number(superForm.ip_premium) || 0,
    });
    refreshDashboard();
    setMessage('Saved super projection settings and refreshed the dashboard.');
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text variant="small" subtle weight="800">
              CAPTURE
            </Text>
            <Text variant="title">Quick entry command pad</Text>
            <Text subtle>
              Get the next record into OzWealthman fast, then return to the dashboard, AI coach, or the deeper workspace later.
            </Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: `${colors.accent}18`, borderColor: colors.accent }]}>
            <Ionicons name="flash-outline" color={colors.accentStrong} size={24} />
          </View>
        </View>
        <MetricRow label="Suggested use" value={modeCopy[mode].title} />
        <Text subtle>{message}</Text>
      </Panel>

      <SectionHeader title="Capture mode" action="Switch the front door" />
      <View style={styles.modeGrid}>
        {(Object.keys(modeCopy) as CaptureMode[]).map((item) => {
          const active = mode === item;
          return (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[
                styles.modeCard,
                {
                  backgroundColor: active ? `${colors.accent}18` : colors.surface,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <View style={[styles.modeIcon, { backgroundColor: active ? `${colors.accent}25` : colors.surfaceRaised }]}>
                <Ionicons name={modeCopy[item].icon} color={active ? colors.accentStrong : colors.text} size={18} />
              </View>
              <Text weight="900">{modeCopy[item].title}</Text>
              <Text variant="small" subtle>
                {modeCopy[item].helper}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'investment' ? (
        <Panel style={styles.formPanel}>
          <SectionHeader title="Investment capture" action="Personal portfolio" />
          <View style={styles.chipRow}>
            {['ETF purchase', 'Crypto purchase', 'Bullion lot', 'Dividend income', 'Other investment'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setInvestmentForm((current) => ({ ...current, type }))}
                style={[styles.chip, { backgroundColor: investmentForm.type === type ? colors.accent : colors.surfaceRaised, borderColor: investmentForm.type === type ? colors.accent : colors.border }]}
              >
                <Text weight="800" style={{ color: investmentForm.type === type ? colors.background : colors.text }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput placeholder="Symbol or label" placeholderTextColor={colors.muted} value={investmentForm.label} onChangeText={(value) => setInvestmentForm((current) => ({ ...current, label: value }))} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          <View style={styles.inputGrid}>
            <TextInput placeholder="Quantity" placeholderTextColor={colors.muted} value={investmentForm.quantity} onChangeText={(value) => setInvestmentForm((current) => ({ ...current, quantity: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
            <TextInput placeholder="Amount" placeholderTextColor={colors.muted} keyboardType="numeric" value={investmentForm.amount} onChangeText={(value) => setInvestmentForm((current) => ({ ...current, amount: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          </View>
          <PrimaryButton label="Save investment now" onPress={saveInvestment} />
        </Panel>
      ) : null}

      {mode === 'property_bill' ? (
        <Panel style={styles.formPanel}>
          <SectionHeader title="Property bill capture" action="Paid or upcoming" />
          <View style={styles.chipRow}>
            {data.propertyHoldings.map((property) => (
              <Pressable
                key={property.id}
                onPress={() => setBillForm((current) => ({ ...current, property_id: property.id }))}
                style={[styles.chip, { backgroundColor: billForm.property_id === property.id ? colors.accent : colors.surfaceRaised, borderColor: billForm.property_id === property.id ? colors.accent : colors.border }]}
              >
                <Text weight="800" style={{ color: billForm.property_id === property.id ? colors.background : colors.text }}>
                  {property.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput placeholder="Vendor" placeholderTextColor={colors.muted} value={billForm.vendor} onChangeText={(value) => setBillForm((current) => ({ ...current, vendor: value }))} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          <View style={styles.inputGrid}>
            <TextInput placeholder="Bill type" placeholderTextColor={colors.muted} value={billForm.bill_type} onChangeText={(value) => setBillForm((current) => ({ ...current, bill_type: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
            <TextInput placeholder="Amount" placeholderTextColor={colors.muted} keyboardType="numeric" value={billForm.amount} onChangeText={(value) => setBillForm((current) => ({ ...current, amount: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          </View>
          <PrimaryButton label="Save bill now" onPress={savePropertyBill} />
        </Panel>
      ) : null}

      {mode === 'smsf' ? (
        <Panel style={styles.formPanel}>
          <SectionHeader title="SMSF quick ledger" action="Units, cash, contribution" />
          <View style={styles.chipRow}>
            {['Contribution', 'ETF units', 'Crypto units', 'Metal lot', 'Cash movement', 'Property expense'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setSmsfForm((current) => ({ ...current, type }))}
                style={[styles.chip, { backgroundColor: smsfForm.type === type ? colors.accent : colors.surfaceRaised, borderColor: smsfForm.type === type ? colors.accent : colors.border }]}
              >
                <Text weight="800" style={{ color: smsfForm.type === type ? colors.background : colors.text }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput placeholder="Label" placeholderTextColor={colors.muted} value={smsfForm.label} onChangeText={(value) => setSmsfForm((current) => ({ ...current, label: value }))} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          <View style={styles.inputGrid}>
            <TextInput placeholder="Quantity" placeholderTextColor={colors.muted} value={smsfForm.quantity} onChangeText={(value) => setSmsfForm((current) => ({ ...current, quantity: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
            <TextInput placeholder="Amount" placeholderTextColor={colors.muted} keyboardType="numeric" value={smsfForm.amount} onChangeText={(value) => setSmsfForm((current) => ({ ...current, amount: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          </View>
          <PrimaryButton label="Save SMSF entry now" onPress={saveSMSF} />
        </Panel>
      ) : null}

      {mode === 'super' ? (
        <Panel style={styles.formPanel}>
          <SectionHeader title="Super projection settings" action="Quick modeller inputs" />
          <View style={styles.inputGrid}>
            <TextInput placeholder="Salary sacrifice / month" placeholderTextColor={colors.muted} keyboardType="numeric" value={superForm.salary_sacrifice} onChangeText={(value) => setSuperForm((current) => ({ ...current, salary_sacrifice: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
            <TextInput placeholder="TPD premium / month" placeholderTextColor={colors.muted} keyboardType="numeric" value={superForm.tpd_premium} onChangeText={(value) => setSuperForm((current) => ({ ...current, tpd_premium: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
            <TextInput placeholder="IP premium / month" placeholderTextColor={colors.muted} keyboardType="numeric" value={superForm.ip_premium} onChangeText={(value) => setSuperForm((current) => ({ ...current, ip_premium: value }))} style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          </View>
          <PrimaryButton label="Save super settings now" onPress={saveSuperSettings} />
        </Panel>
      ) : null}

      <SectionHeader title="Jump next" action="Go deeper after capture" />
      <View style={styles.jumpRow}>
        <JumpCard icon="chatbubble-ellipses-outline" title="Ask OzWealthman" helper="Convert notes into tool actions" onPress={() => router.push('/(tabs)/ai')} />
        <JumpCard icon="home-outline" title="Property centre" helper="Bills, debt and operating detail" onPress={() => router.push('/(tabs)/property')} />
        <JumpCard icon="business-outline" title="SMSF" helper="Portfolio and liquidity pressure" onPress={() => router.push('/(tabs)/smsf')} />
      </View>
    </Screen>
  );
}

function JumpCard({ icon, title, helper, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; helper: string; onPress: () => void }) {
  const { colors } = useWealthTheme();
  return (
    <Pressable onPress={onPress} style={[styles.jumpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.jumpIcon, { backgroundColor: colors.surfaceRaised }]}>
        <Ionicons name={icon} color={colors.accentStrong} size={18} />
      </View>
      <View style={styles.jumpCopy}>
        <Text weight="900">{title}</Text>
        <Text variant="small" subtle>{helper}</Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.muted} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  hero: { gap: 12 },
  heroTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  heroCopy: { flex: 1, gap: 4 },
  heroIcon: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  modeGrid: { gap: 10 },
  modeCard: { borderRadius: 8, borderWidth: 1, gap: 8, padding: 14 },
  modeIcon: { alignItems: 'center', borderRadius: 8, height: 36, justifyContent: 'center', width: 36 },
  formPanel: { gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  input: { borderRadius: 8, borderWidth: 1, minHeight: 46, paddingHorizontal: 12 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  halfInput: { flexGrow: 1, minWidth: 150 },
  jumpRow: { gap: 10 },
  jumpCard: { alignItems: 'center', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  jumpIcon: { alignItems: 'center', borderRadius: 8, height: 36, justifyContent: 'center', width: 36 },
  jumpCopy: { flex: 1, gap: 3 },
});
