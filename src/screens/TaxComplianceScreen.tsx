import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { getTaxTrackerSummary } from '@/services/taxServices';
import { getSMSFComplianceAlerts } from '@/services/complianceReminderService';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatDate } from '@/utils/format';

export function TaxComplianceScreen() {
  const { colors } = useWealthTheme();
  const summary = getTaxTrackerSummary();
  const alerts = getSMSFComplianceAlerts();

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View>
        <Text variant="small" subtle weight="800">
          TAX AND AUDIT
        </Text>
        <Text variant="title">Estimator and checklist</Text>
        <Text subtle>Track PAYG preparation, investment records, SMSF tax estimates and audit readiness.</Text>
      </View>

      <Panel style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.warning }]}>
        <Text variant="label" subtle>
          NEXT DEADLINE
        </Text>
        <Text variant="section">{summary.nextDue?.title}</Text>
        <Text style={{ color: colors.warning }} weight="800">
          {summary.nextDue ? formatDate(summary.nextDue.due_date) : 'No due items'}
        </Text>
      </Panel>

      <SectionHeader title="Tax estimates" />
      <Panel>
        <MetricRow label="PAYG taxable income" value={formatCurrency(summary.payg.taxableIncome)} />
        <MetricRow label="PAYG estimated tax" value={formatCurrency(summary.payg.estimatedTotalTax)} tone="warning" />
        <MetricRow label="SMSF taxable income" value={formatCurrency(summary.smsf.taxableIncome)} />
        <MetricRow label="SMSF estimated tax" value={formatCurrency(summary.smsf.estimatedTax)} tone="warning" />
        <Text variant="small" subtle>
          Estimates are tracking tools only and must be reviewed by a registered tax agent or SMSF accountant.
        </Text>
      </Panel>

      <SectionHeader title="PAYG and investment tracker" />
      <Panel>
        {summary.trackerItems.map((item) => (
          <View key={item.id} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.accent}22` }]}>
              <Ionicons name="document-text-outline" color={colors.accentStrong} size={18} />
            </View>
            <View style={styles.copy}>
              <Text weight="800">{item.title}</Text>
              <Text variant="small" subtle>
                {item.context.toUpperCase()} due {formatDate(item.due_date)}
              </Text>
              <Text variant="small" subtle>{item.notes}</Text>
            </View>
          </View>
        ))}
      </Panel>

      <SectionHeader title="SMSF audit checklist" />
      <Panel>
        {summary.smsfChecklist.map((item) => (
          <View key={item.id} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: item.completed ? `${colors.success}22` : `${colors.warning}22` }]}>
              <Ionicons name={item.completed ? 'checkmark-outline' : 'notifications-outline'} color={item.completed ? colors.success : colors.warning} size={18} />
            </View>
            <View style={styles.copy}>
              <Text weight="800">{item.title}</Text>
              <Text variant="small" subtle>
                {item.category.toUpperCase()} due {formatDate(item.due_date)}
              </Text>
            </View>
            <Text variant="small" weight="800" style={{ color: item.completed ? colors.success : colors.warning }}>
              {item.completed ? 'Done' : item.priority}
            </Text>
          </View>
        ))}
      </Panel>

      <SectionHeader title="Bell alerts" />
      <Panel>
        {alerts.map((alert) => (
          <View key={alert.id} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: alert.severity === 'urgent' ? `${colors.danger}22` : `${colors.warning}22` }]}>
              <Ionicons name="notifications-outline" color={alert.severity === 'urgent' ? colors.danger : colors.warning} size={18} />
            </View>
            <View style={styles.copy}>
              <Text weight="800">{alert.title}</Text>
              <Text variant="small" subtle>
                {alert.daysUntilDue} days until due - {alert.reminderMessage}
              </Text>
            </View>
          </View>
        ))}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  hero: { gap: 8 },
  row: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  copy: { flex: 1, gap: 3 },
  iconBox: { alignItems: 'center', borderRadius: 8, height: 34, justifyContent: 'center', width: 34 },
});
