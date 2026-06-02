/**
 * Premium Dark Theme Color System
 * Strict color tokens - DO NOT deviate from these values
 */
export const Colors = {
  // Backgrounds
  background: '#0E1116',           // Deep Midnight Navy - main app background
  surface: '#161B22',              // Secondary background - cards, surfaces
  elevated: '#1F2630',             // Elevated surface - modals, popups
  
  // Accent (use sparingly - primary actions only)
  accent: '#C6A85C',               // Muted Warm Gold - primary actions & highlights ONLY
  accentPressed: '#A98E4E',        // Accent pressed state
  
  // Text Hierarchy
  text: '#F5F7FA',                 // Primary text
  textSecondary: '#9BA6B2',        // Secondary text
  textMuted: '#6B7280',            // Muted text
  
  // UI Elements
  divider: '#2A2F3A',              // Divider / Border
  
  // Status Colors
  success: '#3FA37C',              // Success state
  error: '#C75C5C',                // Error state
  
  // Legacy support (mapped to new system)
  primary: '#C6A85C',              // Maps to accent
  white: '#F5F7FA',                // Maps to primary text
  inputBackground: '#161B22',      // Maps to surface
  cardBackground: '#161B22',       // Maps to surface
  disabled: '#6B7280',             // Maps to muted text
  
  // Additional aliases
  textPrimary: '#F5F7FA',          // Alias for text
  textTertiary: '#6B7280',         // Alias for muted text
  border: '#2A2F3A',               // Alias for divider
  primaryLight: 'rgba(198, 168, 92, 0.2)', // Light version of accent
};
