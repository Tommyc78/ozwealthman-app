import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useWealthTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ label, onPress, variant = 'primary' }: Props) {
  const { colors, radius } = useWealthTheme();
  const backgroundColor = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surfaceRaised;
  const textColor = variant === 'primary' ? colors.background : variant === 'secondary' ? colors.text : '#FFFFFF';
  const borderColor = variant === 'primary' ? colors.accentStrong : variant === 'danger' ? colors.danger : colors.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderRadius: radius.md,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text weight="800" style={{ color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
});
