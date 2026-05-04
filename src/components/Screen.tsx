import { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
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
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(22, 163, 74, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(212, 175, 55, 0.06) 0%, transparent 55%),
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
