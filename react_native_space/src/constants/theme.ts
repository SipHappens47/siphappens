import { MD3DarkTheme } from 'react-native-paper';
import { Colors } from './colors';

/**
 * Premium Dark Theme Configuration
 * Follows strict Material Design 3 dark theme with custom premium colors
 */
export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary accent color (Muted Warm Gold) - used for buttons, active states
    primary: Colors.accent,
    primaryContainer: Colors.accentPressed,
    onPrimary: Colors.background, // Dark text on gold buttons
    onPrimaryContainer: Colors.text,
    
    // Backgrounds
    background: Colors.background,  // Deep Midnight Navy
    surface: Colors.surface,        // Cards, surfaces
    surfaceVariant: Colors.elevated, // Elevated elements
    
    // Text
    onBackground: Colors.text,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
    
    // Secondary elements
    secondary: Colors.textSecondary,
    onSecondary: Colors.text,
    
    // Borders and outlines
    outline: Colors.divider,
    outlineVariant: Colors.divider,
    
    // Status colors
    error: Colors.error,
    onError: Colors.text,
    
    // Disabled state
    surfaceDisabled: Colors.surface,
    onSurfaceDisabled: Colors.disabled,
    
    // Elevation overlays (keep minimal for flat dark theme)
    elevation: {
      level0: Colors.background,
      level1: Colors.surface,
      level2: Colors.surface,
      level3: Colors.elevated,
      level4: Colors.elevated,
      level5: Colors.elevated,
    },
  },
  
  // Rounded corners for premium feel
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
