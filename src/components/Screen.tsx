import { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleProp, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWealthTheme } from '@/theme/ThemeProvider';

type Props = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, contentContainerStyle }: Props) {
  const { colors, spacing } = useWealthTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideWeb = isWeb && width >= 900;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isWeb ? 'transparent' : colors.background }]}
      edges={isWeb ? [] : ['top']}
    >
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: isWideWeb ? 1480 : undefined,
            padding: isWideWeb ? 30 : spacing.lg,
            paddingBottom: isWideWeb ? 48 : 112,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: 16,
    width: '100%',
  },
});
