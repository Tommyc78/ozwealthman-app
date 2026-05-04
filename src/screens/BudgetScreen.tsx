import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useWealthTheme } from '@/theme/ThemeProvider';

const AU_CATEGORIES = [
  { group: "Housing", items: [
    { name: "Mortgage / Rent", budgeted: 1850 },
    { name: "Council Rates & Water", budgeted: 280 },
    { name: "Home Insurance", budgeted: 110 },
    { name: "Electricity & Gas", budgeted: 260 },
  ]},
  { group: "Transport", items: [
    { name: "Fuel", budgeted: 220 },
    { name: "Car Rego & Insurance", budgeted: 190 },
    { name: "Public Transport / Parking", budgeted: 90 },
  ]},
  { group: "Living Expenses", items: [
    { name: "Groceries", budgeted: 680 },
    { name: "Dining Out & Takeaway", budgeted: 260 },
    { name: "Coffee & Snacks", budgeted: 110 },
  ]},
  { group: "Finance & Wealth", items: [
    { name: "Super / Salary Sacrifice", budgeted: 550 },
    { name: "SMSF Fees", budgeted: 85 },
    { name: "Investment Property Costs", budgeted: 450 },
    { name: "Credit Card Repayments", budgeted: 320 },
  ]},
  { group: "Lifestyle & Other", items: [
    { name: "Entertainment & Streaming", budgeted: 95 },
    { name: "Sports / Hobbies", budgeted: 140 },
    { name: "Tradie Tools / Equipment", budgeted: 120 },
    { name: "Pet Care", budgeted: 80 },
    { name: "Gifts & Family", budgeted: 150 },
  ]},
];

export function BudgetScreen() {
  const { colors, radius, spacing } = useWealthTheme();
  const [budgetData] = useState(AU_CATEGORIES);

  const handleUploadStatement = () => {
    Alert.alert(
      "Coming Soon",
      "CSV bank statement upload will be available in the next release."
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.xl }}
    >
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.lg }}>
        Monthly Budget
      </Text>

      <View style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <Text style={{ fontSize: 18, color: colors.textSubtle }}>Total Budgeted • $4,812</Text>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text, marginVertical: 4 }}>
          $3,241 spent
        </Text>
        <Text style={{ color: colors.success }}>67% of budget used • 18 days left</Text>
      </View>

      <TouchableOpacity
        onPress={handleUploadStatement}
        style={{
          backgroundColor: colors.accent,
          padding: spacing.lg,
          borderRadius: radius.md,
          alignItems: 'center',
          marginBottom: spacing.xxl,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '600', fontSize: 16 }}>
          📤 Upload Bank / Credit Card Statement (CSV)
        </Text>
      </TouchableOpacity>

      {budgetData.map((group, gIndex) => (
        <View
          key={gIndex}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.lg }}>
            {group.group}
          </Text>

          {group.items.map((item, iIndex) => (
            <View
              key={iIndex}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: spacing.md,
                borderBottomWidth: iIndex < group.items.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text }}>{item.name}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  ${item.budgeted}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSubtle }}>budgeted</Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity style={{
        borderWidth: 2,
        borderColor: colors.accent,
        borderStyle: 'dashed',
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.xxl,
      }}>
        <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>
          + Add Custom Category
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
