// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, {useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {COLORS, FONT_SIZES} from '../theme';

export type ActionButtonProps = {
  label: string;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  testID?: string;
};

export const ActionButton = ({
  label,
  onPress,
  hasTVPreferredFocus = false,
  testID,
}: ActionButtonProps) => {
  // Pressable has no built-in focus visuals on Vega, so track focus here.
  // onBlur matters too: without it the button stays highlighted after focus
  // moves on.
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      // Focus is shown three ways (border, fill and scale), so it stays visible
      // on washed-out TVs and to color-deficient viewers.
      style={[styles.button, focused && styles.buttonFocused]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 16,
    marginBottom: 16,
  },
  buttonFocused: {
    borderColor: COLORS.focusBorder,
    backgroundColor: COLORS.buttonBackgroundFocused,
    transform: [{scale: 1.05}],
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.button,
    fontWeight: '600',
  },
});
