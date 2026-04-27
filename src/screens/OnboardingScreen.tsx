import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useWealthTheme } from '@/theme/ThemeProvider';

const ozWealthmanLogo = require('../../assets/wealthman_logo_wide.png');

const toggles = [
  ['has_smsf', 'SMSF'],
  ['has_property', 'Property'],
  ['has_etfs', 'Shares / ETFs'],
  ['has_bullion', 'Bullion'],
  ['has_crypto', 'Crypto'],
] as const;

export function OnboardingScreen() {
  const { colors } = useWealthTheme();
  const [flags, setFlags] = useState<Record<string, boolean>>({
    has_smsf: true,
    has_property: true,
    has_etfs: true,
    has_bullion: true,
    has_crypto: true,
  });

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Image source={ozWealthmanLogo} style={styles.logo} resizeMode="contain" />
        <Text variant="small" subtle weight="800">
          START OZWEALTHMAN
        </Text>
        <Text variant="title">Build your dashboard</Text>
        <Text subtle>Start from a clean profile, add one asset at a time, or open the seeded Australian demo account.</Text>
      </View>

      <SectionHeader title="Setup path" />
      <View style={styles.pathGrid}>
        <PathCard
          title="Start from scratch"
          helper="Create profile, then add cashflow, investments, property, super and SMSF only if relevant."
          icon="create-outline"
          onPress={() => undefined}
        />
        <PathCard
          title="Use demo data"
          helper="Open the current seeded command centre to see the full product working immediately."
          icon="speedometer-outline"
          onPress={() => router.replace('/(tabs)')}
        />
        <PathCard
          title="Add one record"
          helper="Go straight to the right workspace and capture a transaction, bill, holding or SMSF entry."
          icon="add-circle-outline"
          onPress={() => router.replace('/(tabs)/investments')}
        />
      </View>

      <SectionHeader title="Profile" />
      <Panel style={styles.formPanel}>
        {['First name', 'Age', 'Employment income', 'Monthly expenses estimate', 'Current super balance'].map((field) => (
          <TextInput
            key={field}
            placeholder={field}
            placeholderTextColor={colors.muted}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        ))}
      </Panel>

      <SectionHeader title="Assets to track" />
      <Panel style={styles.formPanel}>
        {toggles.map(([key, label]) => (
          <View key={key} style={styles.toggleRow}>
            <Text weight="800">{label}</Text>
            <Switch value={flags[key]} onValueChange={(value) => setFlags((current) => ({ ...current, [key]: value }))} />
          </View>
        ))}
      </Panel>

      <SectionHeader title="Demo mode" />
      <Panel style={styles.formPanel}>
        <MetricRow label="Seeded user" value="Australian wealth dashboard" />
        <Text subtle>Demo mode loads salary, family spending, super, SMSF properties, ETFs, Bitcoin, cash and bullion lots.</Text>
        <PrimaryButton label="Open demo dashboard" onPress={() => router.replace('/(tabs)')} />
      </Panel>
    </Screen>
  );
}

function PathCard({ title, helper, icon, onPress }: { title: string; helper: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const { colors } = useWealthTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pathCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
    >
      <View style={[styles.pathIcon, { backgroundColor: colors.surfaceRaised }]}>
        <Ionicons name={icon} color={colors.accentStrong} size={18} />
      </View>
      <Text weight="900">{title}</Text>
      <Text variant="small" subtle>
        {helper}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
  },
  hero: {
    gap: 8,
  },
  logo: {
    borderRadius: 8,
    height: 118,
    width: '100%',
  },
  pathGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pathCard: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 8,
    minHeight: 150,
    minWidth: 220,
    padding: 15,
    width: '31%',
  },
  pathIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  formPanel: {
    gap: 12,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
});
