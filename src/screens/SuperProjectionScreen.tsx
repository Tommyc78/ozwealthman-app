import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
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

type Contribution = { label: string; amount: number; frequency: string; date: string };

const FREQ_OPTIONS = ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Annually'];

export function SuperProjectionScreen() {
  const { colors, radius, spacing } = useWealthTheme();
  const appData = useAppData();
  const superData = appData.superHoldings || appData.super || {};

  const currentBalance = superData.balance || superData.current_balance || 386000;
  const employerContrib = superData.employer_contribution || superData.employer || 1800;
  const salarySacrifice = superData.salary_sacrifice || 550;

  // Insurance state
  const [tpdCover, setTpdCover] = useState(String(superData.tpd_cover || superData.tpd || 500000));
  const [tpdPremium, setTpdPremium] = useState(String(superData.tpd_premium || 42));
  const [ipCover, setIpCover] = useState(String(superData.income_protection_cover || superData.ip_cover || 8000));
  const [ipPremium, setIpPremium] = useState(String(superData.ip_premium || superData.income_protection_premium || 68));
  const [ipWaitingPeriod, setIpWaitingPeriod] = useState(String(superData.ip_waiting_period || 90));
  const [ipBenefitPeriod, setIpBenefitPeriod] = useState(String(superData.ip_benefit_period || '2 years'));
  const [insuranceSaved, setInsuranceSaved] = useState(false);
  const [insuranceEditing, setInsuranceEditing] = useState(false);

  // Contribution state
  const [contributions, setContributions] = useState<Contribution[]>(
    superData.extra_contributions || []
  );
  const [showAddContrib, setShowAddContrib] = useState(false);
  const [contribLabel, setContribLabel] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribFreq, setContribFreq] = useState('Monthly');

  // Projection state
  const [retirementAge, setRetirementAge] = useState(String(superData.retirement_age || 60));
  const [currentAge, setCurrentAge] = useState(String(superData.current_age || 38));
  const [returnRate, setReturnRate] = useState(String(superData.return_rate || 7.5));

  const projection = useMemo(() => {
    const years = Math.max((Number(retirementAge) || 60) - (Number(currentAge) || 38), 1);
    const rate = (Number(returnRate) || 7.5) / 100;
    const monthlyReturn = rate / 12;

    let annualContrib = (employerContrib + salarySacrifice) * 12;
    contributions.forEach((c) => {
      const amt = c.amount || 0;
      if (c.frequency === 'Weekly') annualContrib += amt * 52;
      else if (c.frequency === 'Fortnightly') annualContrib += amt * 26;
      else if (c.frequency === 'Monthly') annualContrib += amt * 12;
      else if (c.frequency === 'Quarterly') annualContrib += amt * 4;
      else annualContrib += amt;
    });

    let balance = currentBalance;
    const yearlyBalances: number[] = [balance];
    for (let y = 0; y < years; y++) {
      balance = balance * (1 + rate) + annualContrib;
      yearlyBalances.push(Math.round(balance));
    }

    return { projectedBalance: Math.round(balance), years, annualContrib, yearlyBalances };
  }, [currentBalance, employerContrib, salarySacrifice, contributions, retirementAge, currentAge, returnRate]);

  const handleSaveInsurance = () => {
    appData.updateSuper?.({
      ...superData,
      tpd_cover: Number(tpdCover) || 0,
      tpd_premium: Number(tpdPremium) || 0,
      income_protection_cover: Number(ipCover) || 0,
      ip_premium: Number(ipPremium) || 0,
      ip_waiting_period: Number(ipWaitingPeriod) || 0,
      ip_benefit_period: ipBenefitPeriod,
    });
    setInsuranceSaved(true);
    setInsuranceEditing(false);
    setTimeout(() => setInsuranceSaved(false), 3000);
  };

  const addContribution = () => {
    if (!contribLabel || !contribAmount) return;
    const newContrib: Contribution = {
      label: contribLabel,
      amount: Number(contribAmount) || 0,
      frequency: contribFreq,
      date: new Date().toISOString(),
    };
    const updated = [...contributions, newContrib];
    setContributions(updated);
    appData.updateSuper?.({ ...superData, extra_contributions: updated });
    setContribLabel('');
    setContribAmount('');
    setShowAddContrib(false);
  };

  const removeContribution = (index: number) => {
    const updated = contributions.filter((_, i) => i !== index);
    setContributions(updated);
    appData.updateSuper?.({ ...superData, extra_contributions: updated });
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text variant="small" subtle weight="800">SUPERANNUATION</Text>
        <Text variant="title">Super projection</Text>
        <Text subtle>Model your super balance at retirement. Adjust contributions, insurance and return assumptions.</Text>
      </View>

      <Panel style={{ borderColor: colors.accent }}>
        <Text variant="small" subtle weight="800">CURRENT SUPER BALANCE</Text>
        <Text variant="title" style={{ fontSize: 34 }}>{formatCurrency(currentBalance)}</Text>
        <View style={styles.heroMetrics}>
          <InlineMetric label="Employer" value={formatCurrency(employerContrib)} sub="/month" color={colors.success} />
          <InlineMetric label="Salary Sacrifice" value={formatCurrency(salarySacrifice)} sub="/month" color={colors.accent} />
          <InlineMetric label="Projected at retirement" value={formatCurrency(projection.projectedBalance)} sub={`in ${projection.years} yrs`} color={colors.accentStrong} />
        </View>
      </Panel>

      <SectionHeader title="Projection model" action="Adjust assumptions" />
      <Panel>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text variant="small" subtle weight="800">CURRENT AGE</Text>
            <TextInput
              value={currentAge}
              onChangeText={setCurrentAge}
              keyboardType="numeric"
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text variant="small" subtle weight="800">RETIREMENT AGE</Text>
            <TextInput
              value={retirementAge}
              onChangeText={setRetirementAge}
              keyboardType="numeric"
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text variant="small" subtle weight="800">RETURN RATE %</Text>
            <TextInput
              value={returnRate}
              onChangeText={setReturnRate}
              keyboardType="numeric"
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
          </View>
        </View>
        <View style={[styles.projectionBar, { backgroundColor: colors.surfaceRaised, borderRadius: radius.sm }]}>
          <Ionicons name="trending-up" color={colors.success} size={20} />
          <View style={{ flex: 1 }}>
            <Text weight="800">Projected balance at age {retirementAge}</Text>
            <Text variant="title" style={{ color: colors.accentStrong }}>{formatCurrency(projection.projectedBalance)}</Text>
            <Text variant="small" subtle>Based on {formatCurrency(projection.annualContrib)}/yr contributions at {returnRate}% return</Text>
          </View>
        </View>
      </Panel>

      <SectionHeader title="Extra contributions" action={`${contributions.length} active`} />
      <Panel>
        {contributions.length === 0 && !showAddContrib && (
          <Text subtle>No extra contributions set up yet. Add voluntary contributions to model their impact on your balance.</Text>
        )}
        {contributions.map((c, index) => (
          <View key={index} style={[styles.contribRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.contribIcon, { backgroundColor: `${colors.success}22` }]}>
              <Ionicons name="add-circle" color={colors.success} size={18} />
            </View>
            <View style={styles.contribCopy}>
              <Text weight="800">{c.label}</Text>
              <Text variant="small" subtle>{c.frequency}</Text>
            </View>
            <Text weight="800" style={{ color: colors.success }}>{formatCurrency(c.amount)}</Text>
            <Pressable onPress={() => removeContribution(index)} style={styles.smallBtn}>
              <Ionicons name="trash-outline" color={colors.danger} size={15} />
            </Pressable>
          </View>
        ))}
        {showAddContrib ? (
          <View style={styles.addForm}>
            <Text weight="800">New contribution</Text>
            <TextInput
              placeholder="Label (e.g. Personal non-concessional)"
              placeholderTextColor={colors.muted}
              value={contribLabel}
              onChangeText={setContribLabel}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
            <TextInput
              placeholder="Amount ($)"
              placeholderTextColor={colors.muted}
              value={contribAmount}
              onChangeText={setContribAmount}
              keyboardType="numeric"
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
            <Text variant="small" subtle weight="800">FREQUENCY</Text>
            <View style={styles.freqRow}>
              {FREQ_OPTIONS.map((f) => (
                <Pressable key={f} onPress={() => setContribFreq(f)} style={[styles.freqChip, { backgroundColor: contribFreq === f ? colors.accent : colors.surfaceRaised, borderColor: contribFreq === f ? colors.accent : colors.border }]}>
                  <Text variant="small" weight="800" style={{ color: contribFreq === f ? colors.background : colors.text }}>{f}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formActions}>
              <Pressable onPress={addContribution} style={[styles.formBtn, { backgroundColor: colors.success }]}>
                <Text weight="900" style={{ color: colors.background }}>Add</Text>
              </Pressable>
              <Pressable onPress={() => setShowAddContrib(false)} style={[styles.formBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setShowAddContrib(true)} style={styles.addRow}>
            <Ionicons name="add-circle-outline" color={colors.accentStrong} size={16} />
            <Text weight="800" style={{ color: colors.accentStrong }}>Add contribution</Text>
          </Pressable>
        )}
      </Panel>

      <SectionHeader title="Insurance in super" action={insuranceSaved ? '✓ Saved' : (insuranceEditing ? 'Editing' : 'Tap Edit to change')} />
      <Panel>
        {insuranceSaved && (
          <View style={[styles.saveBadge, { backgroundColor: `${colors.success}22`, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" color={colors.success} size={18} />
            <Text weight="800" style={{ color: colors.success }}>Insurance settings saved</Text>
          </View>
        )}

        <View style={styles.insuranceSection}>
          <View style={styles.insuranceHeader}>
            <View style={[styles.insIcon, { backgroundColor: `${colors.accent}22` }]}>
              <Ionicons name="shield-checkmark" color={colors.accent} size={20} />
            </View>
            <Text weight="900" style={{ flex: 1 }}>Total & Permanent Disability (TPD)</Text>
          </View>
          {insuranceEditing ? (
            <View style={styles.insFields}>
              <View style={styles.insFieldRow}>
                <Text subtle style={{ width: 100 }}>Cover amount</Text>
                <TextInput value={tpdCover} onChangeText={setTpdCover} keyboardType="numeric" style={[styles.insInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
              </View>
              <View style={styles.insFieldRow}>
                <Text subtle style={{ width: 100 }}>Premium /mth</Text>
                <TextInput value={tpdPremium} onChangeText={setTpdPremium} keyboardType="numeric" style={[styles.insInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
              </View>
            </View>
          ) : (
            <View style={styles.insFields}>
              <MetricRow label="Cover" value={formatCurrency(Number(tpdCover))} />
              <MetricRow label="Premium" value={`${formatCurrency(Number(tpdPremium))}/mth`} />
            </View>
          )}
        </View>

        <View style={[styles.insuranceSection, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 }]}>
          <View style={styles.insuranceHeader}>
            <View style={[styles.insIcon, { backgroundColor: `${colors.warning}22` }]}>
              <Ionicons name="medkit" color={colors.warning} size={20} />
            </View>
            <Text weight="900" style={{ flex: 1 }}>Income Protection</Text>
          </View>
          {insuranceEditing ? (
            <View style={styles.insFields}>
              <View style={styles.insFieldRow}>
                <Text subtle style={{ width: 100 }}>Cover /mth</Text>
                <TextInput value={ipCover} onChangeText={setIpCover} keyboardType="numeric" style={[styles.insInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
              </View>
              <View style={styles.insFieldRow}>
                <Text subtle style={{ width: 100 }}>Premium /mth</Text>
                <TextInput value={ipPremium} onChangeText={setIpPremium} keyboardType="numeric" style={[styles.insInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
              </View>
              <View style={styles.insFieldRow}>
                <Text subtle style={{ width: 100 }}>Waiting (days)</Text>
                <TextInput value={ipWaitingPeriod} onChangeText={setIpWaitingPeriod} keyboardType="numeric" style={[styles.insInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
              </View>
              <View style={styles.insFieldRow}>
                <Text subtle style={{ width: 100 }}>Benefit period</Text>
                <TextInput value={ipBenefitPeriod} onChangeText={setIpBenefitPeriod} style={[styles.insInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
              </View>
            </View>
          ) : (
            <View style={styles.insFields}>
              <MetricRow label="Cover" value={`${formatCurrency(Number(ipCover))}/mth`} />
              <MetricRow label="Premium" value={`${formatCurrency(Number(ipPremium))}/mth`} />
              <MetricRow label="Waiting period" value={`${ipWaitingPeriod} days`} />
              <MetricRow label="Benefit period" value={ipBenefitPeriod} />
            </View>
          )}
        </View>

        <View style={styles.insActions}>
          {insuranceEditing ? (
            <>
              <Pressable onPress={handleSaveInsurance} style={[styles.formBtn, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark-circle" color={colors.background} size={16} />
                <Text weight="900" style={{ color: colors.background }}>Save</Text>
              </Pressable>
              <Pressable onPress={() => setInsuranceEditing(false)} style={[styles.formBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text weight="900">Cancel</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setInsuranceEditing(true)} style={[styles.formBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="pencil" color={colors.background} size={14} />
              <Text weight="900" style={{ color: colors.background }}>Edit insurance</Text>
            </Pressable>
          )}
        </View>
      </Panel>
    </Screen>
  );
}

function InlineMetric({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <View style={styles.inlineMetric}>
      <Text variant="small" subtle weight="800">{label.toUpperCase()}</Text>
      <Text variant="section" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text variant="small" subtle>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  header: { gap: 4 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  inlineMetric: { flex: 1, gap: 2, minWidth: 120 },
  inputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inputGroup: { flex: 1, gap: 4, minWidth: 100 },
  textInput: { borderRadius: 8, borderWidth: 1, minHeight: 44, paddingHorizontal: 12, fontSize: 15 },
  projectionBar: { flexDirection: 'row', gap: 14, padding: 16, marginTop: 8, alignItems: 'flex-start' },
  contribRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  contribIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  contribCopy: { flex: 1, gap: 2 },
  smallBtn: { padding: 6 },
  addForm: { gap: 10, marginTop: 8 },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqChip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  formBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  insuranceSection: { gap: 10 },
  insuranceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  insFields: { gap: 6, paddingLeft: 46 },
  insFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insInput: { flex: 1, borderRadius: 8, borderWidth: 1, height: 40, paddingHorizontal: 10, fontSize: 14 },
  insActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  saveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, padding: 12 },
});
