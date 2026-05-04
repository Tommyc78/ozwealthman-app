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

  const gradientStyle =
    isWeb
      ? ({
          background: `
            radial-gradient(ellipse 90% 70% at 15% 20%, rgba(16, 120, 60, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 85% 75%, rgba(212, 175, 55, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(34, 197, 94, 0.06) 0%, transparent 60%),
            ${colors.background}
          `,
        } as any)
      : { backgroundColor: colors.background };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={isWeb ? [] : ['top']}>
      <ScrollView
        style={gradientStyle}
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
