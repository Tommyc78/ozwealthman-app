import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useWealthTheme } from '@/theme/ThemeProvider';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Panel({ children, style }: Props) {
  const { colors, radius, spacing } = useWealthTheme();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          borderWidth: 1,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 5,
  },
});
