import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { demoData } from '@/data/seed';
import { subscriptionProducts } from '@/services/subscription';

export function SettingsScreen() {
  return (
    <Screen>
      <Text variant="small" subtle weight="800">
        SETTINGS
      </Text>
      <Text variant="title">Profile and controls</Text>

      <SectionHeader title="User profile" />
      <Panel>
        <MetricRow label="First name" value={demoData.user.first_name} />
        <MetricRow label="Age" value={String(demoData.user.age)} />
        <MetricRow label="Country" value={demoData.user.country} />
        <MetricRow label="Currency" value={demoData.user.currency} />
      </Panel>

      <SectionHeader title="Subscription architecture" />
      <Panel>
        {subscriptionProducts.map((product) => (
          <MetricRow key={product.id} label={product.name} value={product.priceLabel} />
        ))}
        <Text subtle>Premium gating is structured for AI coach, advanced projections, detailed drill-downs and SMSF analytics.</Text>
      </Panel>

      <SectionHeader title="Refresh actions" />
      <Panel>
        <PrimaryButton label="Refresh demo dashboard" onPress={() => undefined} />
        <PrimaryButton label="Refresh market prices" onPress={() => undefined} variant="secondary" />
      </Panel>

      <SectionHeader title="Legal" />
      <Panel>
        <Text subtle>
          OzWealthman provides tracking and general information. It does not provide licensed personal financial advice, banking feeds or broker
          integrations in this MVP.
        </Text>
      </Panel>
    </Screen>
  );
}
