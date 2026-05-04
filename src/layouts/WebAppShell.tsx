import { PropsWithChildren, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useAppData } from '@/data/AppDataProvider';
import { getRouteForPath, mainRoutes } from '@/navigation/mainRoutes';
import { useWealthTheme } from '@/theme/ThemeProvider';

const ozWealthmanLogo = require('../../assets/wealthman_logo_wide.png');

export function WebAppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const activeRoute = getRouteForPath(pathname);
  const { colors } = useWealthTheme();
  const { refreshDashboard } = useAppData();
  const crumbs = ['Home', activeRoute.label].filter((item, index, list) => index === 0 || item !== list[index - 1]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.margin = '0';
    document.body.style.background = `
      radial-gradient(ellipse 70% 55% at 5% 10%, rgba(20, 184, 166, 0.18) 0%, transparent 50%),
      radial-gradient(ellipse 55% 45% at 95% 85%, rgba(139, 92, 246, 0.14) 0%, transparent 45%),
      radial-gradient(ellipse 45% 35% at 50% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse 80% 60% at 60% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 55%),
      #0B0F1E
    `;
    document.body.style.overflow = 'hidden';
    document.body.style.minHeight = '100vh';

    return () => {
      document.body.style.overflow = '';
    };
  }, [colors.background]);

  const glassStyle = Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
      } as any)
    : {};

  const topbarGlass = Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      } as any)
    : {};

  return (
    <View style={[styles.shell, { backgroundColor: 'transparent' }]}>
      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.surface,
            borderRightColor: colors.border,
          },
          glassStyle,
        ]}
      >
        <View style={styles.brandStack}>
          <Image source={ozWealthmanLogo} style={styles.logo} resizeMode="contain" />
          <View>
            <Text variant="small" subtle weight="900">
              OZWEALTHMAN
            </Text>
            <Text weight="900">Command centre</Text>
          </View>
        </View>

        <View style={styles.navList}>
          {mainRoutes.map((item) => {
            const active = activeRoute.key === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => router.replace(item.href)}
                style={({ pressed }) => [
                  styles.navItem,
                  {
                    backgroundColor: active ? colors.surfaceRaised : 'transparent',
                    borderColor: active ? colors.accent : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.navIcon, { backgroundColor: active ? `${colors.accent}22` : colors.surfaceRaised }]}>
                  <Ionicons name={item.icon} color={active ? colors.accentStrong : colors.muted} size={19} />
                </View>
                <View style={styles.navCopy}>
                  <Text weight="900" style={{ color: active ? colors.text : colors.textSubtle }}>
                    {item.label}
                  </Text>
                  <Text variant="small" subtle numberOfLines={1}>
                    {item.webDescription}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
          <Text variant="small" subtle weight="800">
            START OR DEMO
          </Text>
          <Text variant="small" subtle>
            Build from scratch, then add accounts, properties and investments.
          </Text>
          <Pressable
            onPress={() => router.push('/onboarding')}
            style={({ pressed }) => [styles.startButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
          >
            <Ionicons name="add-circle-outline" color={colors.accentStrong} size={17} />
            <Text weight="900">Start setup</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.main}>
        <View
          style={[
            styles.topbar,
            {
              backgroundColor: `${colors.background}88`,
              borderBottomColor: colors.border,
            },
            topbarGlass,
          ]}
        >
          <View>
            <Text variant="small" subtle weight="900">
              AUSTRALIAN WEALTH DASHBOARD
            </Text>
            <View style={styles.breadcrumbs}>
              {crumbs.map((crumb, index) => (
                <View key={`${crumb}-${index}`} style={styles.crumbItem}>
                  {index > 0 ? <Ionicons name="chevron-forward" color={colors.muted} size={13} /> : null}
                  <Pressable onPress={() => (index === 0 ? router.replace('/(tabs)') : undefined)} disabled={index !== 0}>
                    <Text variant="small" subtle={index < crumbs.length - 1} weight="900">
                      {crumb}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Text variant="section">{activeRoute.label}</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              onPress={refreshDashboard}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Ionicons name="refresh-outline" color={colors.accentStrong} size={18} />
              <Text weight="900">Refresh</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/onboarding')}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Ionicons name="add-circle-outline" color={colors.accentStrong} size={18} />
              <Text weight="900">Start setup</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/analyser')}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Ionicons name="calculator-outline" color={colors.accentStrong} size={18} />
              <Text weight="900">Analyse deal</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/ai')}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.accent, borderColor: colors.accent, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Ionicons name="chatbubble-ellipses-outline" color="#0B0F1E" size={18} />
              <Text weight="900" style={{ color: '#0B0F1E' }}>
                Ask OzWealthman
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%',
  },
  sidebar: {
    borderRightWidth: 1,
    display: 'flex',
    gap: 24,
    padding: 22,
    width: 310,
  },
  brandStack: {
    gap: 12,
  },
  logo: {
    borderRadius: 8,
    height: 78,
    width: '100%',
  },
  breadcrumbs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  crumbItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  navList: {
    gap: 8,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 68,
    padding: 11,
  },
  navIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  navCopy: {
    flex: 1,
    gap: 3,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    gap: 6,
    marginTop: 'auto',
    paddingTop: 18,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  topbar: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 82,
    paddingHorizontal: 30,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});
