import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useWealthTheme } from '@/theme/ThemeProvider';
import { AppDataProvider } from '@/data/AppDataProvider';

function RootNavigator() {
  const { colorScheme, colors } = useWealthTheme();
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <RootNavigator />
      </AppDataProvider>
    </ThemeProvider>
  );
}
