import { Ionicons } from '@expo/vector-icons';
import { Href } from 'expo-router';

export type MainRoute = {
  key: string;
  label: string;
  shortLabel: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  webDescription: string;
};

export const mainRoutes: MainRoute[] = [
  {
    key: 'index',
    label: 'Home',
    shortLabel: 'Home',
    href: '/(tabs)',
    icon: 'grid-outline',
    webDescription: 'Net worth, allocation and recent movement',
  },
  {
    key: 'budget',
    label: 'Budget',
    shortLabel: 'Budget',
    href: '/(tabs)/budget',
    icon: 'wallet-outline',
    webDescription: 'Cashflow, categories and recurring bills',
  },
  {
    key: 'property',
    label: 'Property',
    shortLabel: 'Property',
    href: '/(tabs)/property',
    icon: 'home-outline',
    webDescription: 'Current properties, bills, debt and ownership',
  },
  {
    key: 'analyser',
    label: 'Deal Analyser',
    shortLabel: 'Analyser',
    href: '/(tabs)/analyser',
    icon: 'calculator-outline',
    webDescription: 'Run numbers on potential property deals',
  },
  {
    key: 'investments',
    label: 'Investments',
    shortLabel: 'Invest',
    href: '/(tabs)/investments',
    icon: 'pie-chart-outline',
    webDescription: 'Personal ETFs, crypto, metals and taxable assets',
  },
  {
    key: 'super',
    label: 'Super',
    shortLabel: 'Super',
    href: '/(tabs)/super',
    icon: 'trending-up-outline',
    webDescription: 'Projection scenarios and contribution impact',
  },
  {
    key: 'smsf',
    label: 'SMSF',
    shortLabel: 'SMSF',
    href: '/(tabs)/smsf',
    icon: 'business-outline',
    webDescription: 'Assets, liabilities, metals and audit readiness',
  },
  {
    key: 'ai',
    label: 'AI Coach',
    shortLabel: 'AI',
    href: '/(tabs)/ai',
    icon: 'chatbubbles-outline',
    webDescription: 'Ask questions and prepare confirmed updates',
  },
  {
    key: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    href: '/(tabs)/settings',
    icon: 'settings-outline',
    webDescription: 'Profile, data refresh and subscriptions',
  },
];

export function getRouteForPath(pathname: string) {
  if (pathname === '/' || pathname === '/index') {
    return mainRoutes[0];
  }

  return mainRoutes.find((route) => route.key !== 'index' && pathname.includes(route.key)) ?? mainRoutes[0];
}
