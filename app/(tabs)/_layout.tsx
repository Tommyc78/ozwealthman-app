import { Slot } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import { MobileTabNavigator } from '@/layouts/MobileTabNavigator';
import { WebAppShell } from '@/layouts/WebAppShell';

export default function TabsLayout() {
  const { width } = useWindowDimensions();

  if (Platform.OS === 'web' && width >= 768) {
    return (
      <WebAppShell>
        <Slot />
      </WebAppShell>
    );
  }

  return <MobileTabNavigator />;
}


