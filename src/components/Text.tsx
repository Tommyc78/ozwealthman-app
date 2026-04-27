import { PropsWithChildren } from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useWealthTheme } from '@/theme/ThemeProvider';

type Props = PropsWithChildren<
  TextProps & {
    variant?: 'title' | 'section' | 'body' | 'small' | 'label';
    subtle?: boolean;
    weight?: TextStyle['fontWeight'];
  }
>;

export function Text({ children, variant = 'body', subtle, weight, style, ...props }: Props) {
  const { colors, typography } = useWealthTheme();
  const fontSize = variant === 'title' ? typography.title : variant === 'section' ? typography.section : variant === 'small' || variant === 'label' ? typography.small : typography.body;
  const fontWeight: TextStyle['fontWeight'] = weight ?? (variant === 'title' || variant === 'section' || variant === 'label' ? '800' : '500');

  return (
    <RNText
      {...props}
      style={[
        {
          color: subtle ? colors.textSubtle : colors.text,
          fontSize,
          fontWeight,
          letterSpacing: 0,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
