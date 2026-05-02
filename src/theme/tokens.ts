// src/theme/tokens.ts
export const lightColors = {
  background: '#F8FAFC',     // Clean cool white
  surface: 'rgba(255, 255, 255, 0.92)',        // Glassmorphic
  surfaceRaised: 'rgba(255, 255, 255, 0.98)',
  text: '#0F172A',
  textSubtle: '#64748B',
  muted: '#94A3B8',
  border: 'rgba(148, 163, 184, 0.25)',
  accent: '#0A84FF',         // Modern blue
  accentStrong: '#0066CC',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  chartOne: '#0EA5E9',
  chartTwo: '#22C55E',
  chartThree: '#A855F7',
  chartFour: '#F59E0B',
  chartFive: '#EC4899',
};

export const darkColors = {
  background: '#0A0F1C',
  surface: 'rgba(15, 23, 42, 0.85)',
  surfaceRaised: 'rgba(30, 41, 59, 0.9)',
  text: '#F1F5F9',
  textSubtle: '#CBD5E1',
  muted: '#64748B',
  border: 'rgba(148, 163, 184, 0.2)',
  accent: '#60A5FA',
  accentStrong: '#3B82F6',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  chartOne: '#38BDF8',
  chartTwo: '#4ADE80',
  chartThree: '#C084FC',
  chartFour: '#FBBF24',
  chartFive: '#FB7185',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,          // Softer modern corners
};

export const typography = {
  title: 28,
  section: 20,
  body: 16,
  small: 13,
  tiny: 11,
};

export type WealthColors = typeof lightColors;
