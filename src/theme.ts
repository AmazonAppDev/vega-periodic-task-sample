// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Sizes and colors tuned for viewing from about 10 feet. TV text needs to be
// much larger than on mobile, and near-white text avoids the glare (bloom)
// that pure white causes on HDR TVs.

export const FONT_SIZES = {
  log: 20,
  body: 24,
  button: 22,
  title: 48,
};

export const COLORS = {
  textPrimary: '#E5E5E7',
  textSecondary: '#D1D1D6',
  // High-contrast focus color, visible against both the background and the
  // button fill.
  focusBorder: '#00D4FF',
  buttonBackground: 'rgba(255, 255, 255, 0.15)',
  buttonBackgroundFocused: 'rgba(255, 255, 255, 0.3)',
  logBackground: 'rgba(0, 0, 0, 0.55)',
  textShadow: 'rgba(0, 0, 0, 0.6)',
};

// Many TVs crop the outer edges of the picture (overscan). Keep text and
// buttons at least 5% in from every edge.
export const SAFE_ZONE_INSET = '5%';
