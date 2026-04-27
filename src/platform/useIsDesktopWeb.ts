import { Platform, useWindowDimensions } from 'react-native';

export function useIsDesktopWeb() {
  const { width } = useWindowDimensions();

  return Platform.OS === 'web' && width >= 900;
}
