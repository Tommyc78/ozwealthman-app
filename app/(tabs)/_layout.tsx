import { Slot } from 'expo-router';
import { Platform } from 'react-native';
import { MobileTabNavigator } from '@/layouts/MobileTabNavigator';
import { WebAppShell } from '@/layouts/WebAppShell';

export default function TabsLayout() {
  if (Platform.OS === 'web') {
    return (
      <WebAppShell>
        <Slot />
      </WebAppShell>
    );
  }

  return <MobileTabNavigator />;
}
