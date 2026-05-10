import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router, Tabs } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mainRoutes } from '@/navigation/mainRoutes';
import { Text } from '@/components/Text';
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

const primaryTabs = ['index', 'budget', 'investments', 'ai'] as const;
const primaryTabSet = new Set(primaryTabs);

export function MobileTabNavigator() {
  const { colors } = useWealthTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 410;

  return (
    <Tabs
      tabBar={(props) => <CompactMobileTabBar {...props} compact={compact} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: compact ? 64 + Math.max(insets.bottom, 8) : 72 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 0,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name] ?? 'ellipse-outline'} color={color} size={compact ? 22 : size} />
        ),
        ...(primaryTabSet.has(route.name as (typeof primaryTabs)[number]) ? {} : { tabBarButton: () => null }),
      })}
    >
      {mainRoutes.map((route) => (
        <Tabs.Screen key={route.key} name={route.key} options={{ title: compactLabels[route.key] ?? route.shortLabel }} />
      ))}
    </Tabs>
  );
}

function CompactMobileTabBar({ state, navigation, compact }: BottomTabBarProps & { compact: boolean }) {
  const { colors } = useWealthTheme();
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeRouteName = state.routes[state.index]?.name;
  const currentRoute = useMemo(() => mainRoutes.find((route) => route.key === activeRouteName), [activeRouteName]);
  const utilityRoutes = mainRoutes.filter((route) => !primaryTabSet.has(route.key as (typeof primaryTabs)[number]));
  const moreActive = Boolean(currentRoute && !primaryTabSet.has(currentRoute.key as (typeof primaryTabs)[number]));

  const openRoute = (routeKey: string) => {
    setMoreOpen(false);
    navigation.navigate(routeKey);
  };

  return (
    <>
      {moreOpen ? (
        <Pressable style={styles.scrim} onPress={() => setMoreOpen(false)}>
          <View />
        </Pressable>
      ) : null}

      {moreOpen ? (
        <View style={[styles.moreSheet, { backgroundColor: colors.surface, borderColor: colors.border, bottom: 72 + Math.max(insets.bottom, 8) }]}>
          <Text variant="small" subtle weight="800">
            MORE TOOLS
          </Text>
          <View style={styles.moreGrid}>
            {utilityRoutes.map((route) => {
              const selected = activeRouteName === route.key;
              return (
                <Pressable
                  key={route.key}
                  onPress={() => {
                    setMoreOpen(false);
                    router.push(route.href);
                  }}
                  style={[
                    styles.moreCard,
                    {
                      backgroundColor: selected ? `${colors.accent}20` : colors.surfaceRaised,
                      borderColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Ionicons name={route.icon} color={selected ? colors.accentStrong : colors.text} size={18} />
                  <Text weight="800">{route.label}</Text>
                  <Text variant="small" subtle numberOfLines={2}>
                    {route.webDescription}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 8),
            minHeight: compact ? 64 + Math.max(insets.bottom, 8) : 72 + Math.max(insets.bottom, 8),
          },
        ]}
      >
        {primaryTabs.map((routeKey) => {
          const routeIndex = state.routes.findIndex((route) => route.name === routeKey);
          const route = mainRoutes.find((item) => item.key === routeKey);
          if (!route || routeIndex === -1) {
            return null;
          }

          const focused = state.index === routeIndex;
          const tint = focused ? colors.accentStrong : colors.muted;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                setMoreOpen(false);
                openRoute(route.key);
              }}
              style={styles.tabItem}
            >
              <Ionicons name={route.icon} color={tint} size={compact ? 22 : 20} />
              <Text variant="small" weight="800" style={{ color: tint }}>
                {compactLabels[route.key] ?? route.shortLabel}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setMoreOpen((current) => !current)}
          style={[
            styles.tabItem,
            moreOpen && { backgroundColor: `${colors.accent}18` },
          ]}
        >
          <Ionicons name="menu-outline" color={moreActive || moreOpen ? colors.accentStrong : colors.muted} size={compact ? 22 : 20} />
          <Text variant="small" weight="800" style={{ color: moreActive || moreOpen ? colors.accentStrong : colors.muted }}>
            More
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  moreSheet: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    left: 12,
    padding: 14,
    position: 'absolute',
    right: 12,
    zIndex: 40,
  },
  moreGrid: {
    gap: 10,
  },
  moreCard: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minHeight: 72,
    padding: 12,
  },
  tabBar: {
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingTop: 6,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
  },
});
