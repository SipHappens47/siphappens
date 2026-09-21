import React from 'react';
import { Platform, StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';

type HeadingLevel = 1 | 2 | 3;

function webStyle(style: TextProps['style'] | ViewProps['style']) {
  return StyleSheet.flatten(style) as React.CSSProperties;
}

/** Real <h1>–<h3> on web; header role on native. */
export function Heading({
  level = 1,
  children,
  style,
  ...rest
}: TextProps & { level?: HeadingLevel }) {
  if (Platform.OS === 'web') {
    return React.createElement(
      `h${level}`,
      { style: { margin: 0, ...webStyle(style) }, ...rest },
      children,
    );
  }
  return (
    <Text accessibilityRole="header" style={style} {...rest}>
      {children}
    </Text>
  );
}

/** Real landmark elements on web so the document is not heading-less. */
export function Landmark({
  as,
  children,
  style,
  ...rest
}: ViewProps & { as: 'main' | 'header' | 'nav' }) {
  if (Platform.OS === 'web') {
    return React.createElement(as, { style: webStyle(style), ...rest }, children);
  }
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
}
