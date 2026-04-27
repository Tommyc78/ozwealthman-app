import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { Text } from '@/components/Text';
import { demoData } from '@/data/seed';
import { getBullionLotById, getBullionLots, getMetalSpotPrice } from '@/services/calculations';
import { useWealthTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatDate, formatPercent } from '@/utils/format';

export function BullionAssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useWealthTheme();
  const lot = getBullionLotById(id ?? 'bullion-gold-1') ?? getBullionLots()[0];
  const relatedLots = getBullionLots(demoData, lot.metal_type);
  const spot = getMetalSpotPrice(lot.metal_type);
  const averageBuyPrice =
    relatedLots.reduce((total, item) => total + item.total_cost, 0) / Math.max(relatedLots.reduce((total, item) => total + item.quantity, 0), 1);

  return (
    <Screen>
      <View>
        <Text variant="small" subtle weight="800">
          BULLION DETAIL
        </Text>
        <Text variant="title">{lot.item_name}</Text>
        <Text subtle>{lot.storage_location}</Text>
      </View>

      <Panel style={{ backgroundColor: colors.surfaceRaised }}>
        <Text variant="label" subtle>
          CURRENT ESTIMATED VALUE
        </Text>
        <Text variant="title">{formatCurrency(lot.currentEstimatedValue)}</Text>
        <Text style={{ color: lot.unrealizedGainLoss >= 0 ? colors.success : colors.danger }} weight="800">
          {formatCurrency(lot.unrealizedGainLoss)} ({formatPercent(lot.gainLossPercent)})
        </Text>
      </Panel>

      <View style={styles.grid}>
        <StatCard label="Quantity" value={`${lot.quantity} ${lot.unit_type}`} helper={lot.metal_type.toUpperCase()} />
        <StatCard label="Spot price" value={formatCurrency(spot.price ?? 0, 2)} helper={`${spot.currency} per ${spot.unit}`} />
        <StatCard label="Buy price" value={formatCurrency(lot.buy_price_per_unit, 2)} helper="Per unit at purchase" />
        <StatCard label="Average buy" value={formatCurrency(averageBuyPrice, 2)} helper="Across related metal lots" />
      </View>

      <SectionHeader title="Lot record" />
      <Panel>
        <MetricRow label="Metal" value={lot.metal_type.toUpperCase()} />
        <MetricRow label="Unit type" value={lot.unit_type} />
        <MetricRow label="Total cost" value={formatCurrency(lot.total_cost)} />
        <MetricRow label="Purchase date" value={formatDate(lot.purchase_date)} />
        <MetricRow label="Account location" value={lot.storage_location} />
        <MetricRow label="Current spot price" value={formatCurrency(lot.current_spot_price, 2)} />
        <MetricRow label="Current estimated value" value={formatCurrency(lot.currentEstimatedValue)} tone="positive" />
      </Panel>

      <SectionHeader title="Purchase lots ranked" />
      <Panel>
        {relatedLots.map((item) => (
          <View key={item.id} style={[styles.relatedLot, { borderBottomColor: colors.border }]}>
            <View>
              <Text weight="800">{item.item_name}</Text>
              <Text variant="small" subtle>
                {item.quantity} {item.unit_type} bought {formatDate(item.purchase_date)}
              </Text>
            </View>
            <View style={styles.right}>
              <Text weight="800">{formatCurrency(item.currentEstimatedValue)}</Text>
              <Text variant="small" style={{ color: item.unrealizedGainLoss >= 0 ? colors.success : colors.danger }}>
                {formatCurrency(item.unrealizedGainLoss)}
              </Text>
            </View>
          </View>
        ))}
      </Panel>

      <PrimaryButton label="Refresh spot price" onPress={() => undefined} />
      <Text variant="small" subtle>
        Live pricing is abstracted in the pricing service. The current build uses seeded AUD spot values until a metals data provider is connected.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  relatedLot: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  right: {
    alignItems: 'flex-end',
  },
});
