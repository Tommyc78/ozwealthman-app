import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { mainRoutes } from '@/navigation/mainRoutes';
import { useWealthTheme } from '@/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

const icons: Record<string, IconName> = Object.fromEntries(mainRoutes.map((route) => [route.key, route.icon])) as Record<string, IconName>;

export function MobileTabNavigator() {
  const { colors } = useWealthTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 74,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name] ?? 'ellipse-outline'} color={color} size={size} />
        ),
      })}
    >
      {mainRoutes.map((route) => (
        <Tabs.Screen key={route.key} name={route.key} options={{ title: route.shortLabel }} />
      ))}
    </Tabs>
  );
}
