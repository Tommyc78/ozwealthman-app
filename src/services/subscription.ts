export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_annual';
export type PremiumFeature = 'ai_coach' | 'advanced_projections' | 'asset_drilldowns' | 'advanced_smsf_analytics';

const premiumFeatures: PremiumFeature[] = ['ai_coach', 'advanced_projections', 'asset_drilldowns', 'advanced_smsf_analytics'];

export function canUseFeature(plan: SubscriptionPlan, feature: PremiumFeature) {
  if (plan === 'free') {
    return !premiumFeatures.includes(feature);
  }
  return true;
}

export const subscriptionProducts = [
  { id: 'free', name: 'Free', priceLabel: '$0', plan: 'free' as const },
  { id: 'premium_monthly', name: 'Premium Monthly', priceLabel: '$14.99/mo', plan: 'premium_monthly' as const },
  { id: 'premium_annual', name: 'Premium Annual', priceLabel: '$149.99/yr', plan: 'premium_annual' as const },
];
