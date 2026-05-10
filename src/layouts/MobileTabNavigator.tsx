import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mainRoutes } from '@/navigation/mainRoutes';
import { useWealthTheme } from '@/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

const icons: Record<string, IconName> = Object.fromEntries(mainRoutes.map((route) => [route.key, route.icon])) as Record<
  string,
  IconName
>;

const compactLabels: Record<string, string> = {
  index: 'Home',
  budget: 'Budget',
  investments: 'Invest',
  ai: 'AI',
  settings: 'More',
};

const visibleTabs = new Set(['index', 'budget', 'investments', 'ai', 'settings']);

export function MobileTabNavigator() {
  const { colors } = useWealthTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const hideLabels = width < 410;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: !hideLabels,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: hideLabels ? 64 + Math.max(insets.bottom, 8) : 74 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -2,
        },
        tabBarItemStyle: {
          minWidth: 0,
          paddingHorizontal: 0,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name] ?? 'ellipse-outline'} color={color} size={hideLabels ? 24 : size} />
        ),
        ...(visibleTabs.has(route.name) ? {} : { tabBarButton: () => null }),
      })}
    >
      {mainRoutes.map((route) => (
        <Tabs.Screen key={route.key} name={route.key} options={{ title: compactLabels[route.key] ?? route.shortLabel }} />
      ))}
    </Tabs>
  );
}
