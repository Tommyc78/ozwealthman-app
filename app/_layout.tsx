import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useWealthTheme } from '@/theme/ThemeProvider';
import { AppDataProvider } from '@/data/AppDataProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const pathSegments = segments as string[];
  const router = useRouter();
  const { colors } = useWealthTheme();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = pathSegments[0] === '(auth)' || pathSegments.includes('login');
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as never);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as never);
    }
  }, [loading, pathSegments, router, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppDataProvider>
          <AuthGate />
        </AppDataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
