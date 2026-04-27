import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppDataProvider } from '@/data/AppDataProvider';
import { ThemeProvider, useWealthTheme } from '@/theme/ThemeProvider';

function RootNavigator() {
  const { colorScheme, colors } = useWealthTheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
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
